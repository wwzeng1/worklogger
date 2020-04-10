const logger = require('app/services/loggerFactory').getLogger('services/conditionLoader');

function loadCondition(conditionConfig) {
    let conditionType = (conditionConfig || {}).type;
    if (!conditionType) conditionType = 'true';

    const conditionClass = require(`app/conditions/${conditionType}`);
    return new conditionClass(conditionConfig);
}

module.exports.loadCondition = loadCondition;