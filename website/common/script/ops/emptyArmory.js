import i18n from '../i18n';
import { capByLevel } from '../statHelpers';
import { MAX_LEVEL, ARMORY_KEY_GEMS_COST } from '../constants';
import {
  NotAuthorized,
} from '../libs/errors';
import resetGear from '../fns/resetGear';

module.exports = function emptyArmory (user, req = {}, analytics) {
  let itemBalance = ARMORY_KEY_GEMS_COST / 4;

  if (user.balance < itemBalance && user.stats.lvl < MAX_LEVEL) {
    throw new NotAuthorized(i18n.t('notEnoughGems', req.language));
  }

  let analyticsData = {
    uuid: user._id,
    category: 'behavior',
  };

  if (user.stats.lvl < MAX_LEVEL) {
    user.balance -= itemBalance;
    analyticsData.acquireMethod = 'Gems';
    analyticsData.gemCost = ARMORY_KEY_GEMS_COST;
  } else {
    analyticsData.gemCost = 0;
    analyticsData.acquireMethod = '> 100';
  }

  if (analytics) {
    analyticsData.headers = req.headers;
    analytics.track('Empty Armory', analyticsData);
  }

  let lvl = capByLevel(user.stats.lvl);

  resetGear(user);

  let flags = user.flags;
  flags.emptyArmoryEnabled = false;

  if (!user.achievements.emptyArmorys) {
    user.achievements.emptyArmorys = 1;
    user.achievements.emptyArmoryLevel = lvl;
  } else if (lvl > user.achievements.emptyArmoryLevel || lvl === MAX_LEVEL) {
    user.achievements.emptyArmorys++;
    user.achievements.emptyArmoryLevel = lvl;
  }

  if (user.addNotification) user.addNotification('EMPTY_ARMORY_ACHIEVEMENT');

  return [
    {user},
    i18n.t('emptyArmoryComplete'),
  ];
};