const assert = require('assert');
const sinon = require('sinon');

const LoggerOutput = require('app/outputs/Logger/Output');
const NoFormatFormatter = require('app/formatters/NoFormatFormatter');
const WorklogSet = require('app/models/WorklogSet');
const Worklog = require('app/models/Worklog');

describe('Logger output', function() {
    it('can be instantiated', () => {
        assert.doesNotThrow(() => getTestSubject());
    });

    describe('#outputWorklogSet', () => {
        it('calls the logger at least once for the worklogSet and the worklogs', () => {
            const infoFn = sinon.spy();
            const loggerFactory = getFakeLoggerFactory({ fakeInfo: infoFn });
            const output = getTestSubject({ fakeLoggerFactory: loggerFactory });

            const worklogSet = getTestWorklogSet({ worklogCount: 2 });

            output.outputWorklogSet(worklogSet);

            assert.equal(1, infoFn.callCount);
        });
    });
});

function getTestSubject({ fakeLoggerFactory = getFakeLoggerFactory() } = {}) {
    const formatterConfiguration = {};
    const formatter = new NoFormatFormatter(formatterConfiguration);
    const outputConfiguration = {};
    return new LoggerOutput(formatter, outputConfiguration, { LoggerFactory: fakeLoggerFactory });
}

function getFakeLoggerFactory({
    fakeInfo = noop,
} = {}) {
    return {
        getLogger: function getLogger() {
            return {
                info: fakeInfo
            };
        }
    };
}

function noop() {}

function getTestWorklogSet({
    worklogCount = 0,
    startingAt = new Date('2017-01-01T17:00-0400'),
    durationInMinutes = 30
} = {}) {
    const worklogs = [];
    for (let i = 0; i < worklogCount; i++) 
    {
        const endingAt = new Date(+startingAt + durationInMinutes * 60 * 1000);
        const worklog = new Worklog(`Worklog ${i+1}`, startingAt, endingAt);
        worklogs.push(worklog);
        startingAt = endingAt;
    }
    return new WorklogSet(new Date(), new Date(), worklogs);
}