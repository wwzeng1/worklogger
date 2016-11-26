let google = require('googleapis');
let appCredentialStorage = require('./GoogleAppCredentialStorage');
var googleTokenStorage = require('./GoogleTokenStorage');

const Worklog = require('model/Worklog');

class GoogleCalendarInput {
    constructor(configuration) {
        this.configuration = configuration;
    }

    set configuration(value) {
        if (!value)
            throw new Error('Configuration for GoogleCalendarInput is required');

        this._configuration = value;
    }

    getWorkLogs() {
        // arrow functions needed to preserve 'this' context
        return appCredentialStorage.retrieveAppCredentials()
            .then(credentials => googleTokenStorage.authorize(credentials))
            .then(auth => this._getEventsFromApi(auth))
            .then(apiResponses => this._mapToDomainModel(apiResponses, this._configuration));
    }

    _getEventsFromApi(auth) {
        var calendarReturnPromises = this._configuration.calendars
            .map(calendar => this._getEventsFromApiSingleCalendar(auth, calendar));
        return Promise.all(calendarReturnPromises);
    }

    _getEventsFromApiSingleCalendar(auth, calendar) {
        return new Promise((resolve, reject) => {
            google.calendar('v3').events.list({
                auth: auth,
                calendarId: calendar.id,
                timeMin: (new Date()).toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime'
            }, (err, response) => {
                if (err) {
                    reject(`The API returned an error: ${err}`);
                    return;
                }

                resolve({
                    calendarConfig: calendar,
                    events: response.items
                });
            });
        });
    }

    _mapToDomainModel(apiResponses, configuration) {
        return apiResponses
            .map(item => this._mapToWorklogs(item, configuration))
            .reduce((a, b) => a.concat(b), []); // flatten
    }

    _mapToWorklogs(calendarEvents, configuration) {
        var calendarConfig = calendarEvents.calendarConfig;
        var minimumTimeSlotMinutes = configuration.minimumLoggableTimeSlotInMinutes;
        return calendarEvents.events
            .filter(e => !!e.start.dateTime && !!e.end.dateTime)
            .map(e => {
                var startTime = Date.parse(e.start.dateTime);
                var endTime = Date.parse(e.end.dateTime);
                var duration = (endTime - startTime) / 1000 / 60;
                if (duration % minimumTimeSlotMinutes != 0) {
                    duration = minimumTimeSlotMinutes * Math.ceil(duration / minimumTimeSlotMinutes);
                }
                return new Worklog(e.summary, startTime, endTime, duration, calendarConfig.client, calendarConfig.project);
            });

    }
}

module.exports = GoogleCalendarInput;
