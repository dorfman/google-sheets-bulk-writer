const { google } = require('googleapis');

const RATE_LIMIT_ERROR = 429;
const MAX_RETRIES = 2;
const ONE_MINUTE = 60 * 1000;
const DEFAULT_INTERVAL = ONE_MINUTE;
const MIN_INTERVAL = 5 * 1000;

function defaultErrorHandler(err) {
    console.error(err);
}

class BulkWriter {
    constructor({ auth, spreadsheetId, interval, valueInputOption, insertDataOption, errorHandler }) {
        // The data that matters
        this.cache = {};
        this.errorValues = {};

        // Required params
        this.auth = auth;
        this.spreadsheetId = spreadsheetId;

        // Optional params
        this.interval = interval || DEFAULT_INTERVAL;
        this.valueInputOption = valueInputOption || 'USER_ENTERED';
        this.insertDataOption = insertDataOption || 'INSERT_ROWS';
        this.errorHandler = errorHandler || defaultErrorHandler;

        // Param error handling
        if (!this.auth) {
            throw new Error('No auth provided');
        }
        if (!this.spreadsheetId) {
            throw new Error('No spreadsheetId provided');
        }
        if (this.interval < MIN_INTERVAL) {
            throw new Error('Interval must be at least ' + MIN_INTERVAL);
        }

        // Function binding
        this.sheets = google.sheets({ version: 'v4', auth });
        this.write = this.write.bind(this);
        this.flush = this.flush.bind(this);
        process.on('exit', this.flush);
    }

    /** Getters and Setters */

    getInterval() {
        return this.interval;
    }

    setInterval(interval) {
        if (interval < MIN_INTERVAL) {
            throw new Error('Interval must be at least ' + MIN_INTERVAL);
        }

        this.interval = interval;
        this.restart();
    }

    getCache() {
        return this.cache;
    }

    clearRangeQueue(range) {
        delete this.cache[range];
    }

    clearCache() {
        this.cache = {};
    }

    getErrorValues() {
        return this.errorValues;
    }

    clearErrorValues() {
        this.errorValues = {};
    }

    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }

    /** Core */

    start() {
        this.timer = setInterval(this.flush, this.interval);
    }

    stop() {
        clearInterval(this.timer);
    }

    restart() {
        this.stop();
        this.start();
    }

    append(range, values) {
        if (!this.cache[range]) {
            this.cache[range] = [values];
        }
        else {
            this.cache[range].push(values);
        }
    }

    flush() {
        const cache = this.cache;
        this.cache = {};

        for (const range in cache) {
            if (!cache.hasOwnProperty(range)) {
                continue;
            }
            this.write(range, cache[range]);
        }
    }

    write(range, values, retries = 0) {
        return this.sheets
            .spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range,
                valueInputOption: this.valueInputOption,
                insertDataOption: this.insertDataOption,
                resource: { values },
            })
            .catch(err => {
                if (err.code === RATE_LIMIT_ERROR && retries < MAX_RETRIES) {
                    console.log('oh no');
                    return setTimeout(() => this.write(range, values, retries + 1), ONE_MINUTE);
                }

                if (!this.errorValues[range]) {
                    this.errorValues[range] = [values];
                }
                else {
                    this.errorValues[range].push(values);
                }

                return this.errorHandler(err);
            });
    }
}

module.exports = BulkWriter;
