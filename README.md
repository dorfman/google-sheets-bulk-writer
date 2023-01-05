# Google Sheets Bulk Writer

**JavaScript library for queueing data to be bulk written to the Google Sheets API on timed intervals to avoid violating the rate limit**

## Getting Started

### Installation
```bash
npm install google-sheets-bulk-writer --save
```

### Requirements
- Google API v4 Authentication

### Initialization

```javascript
const BulkWriter = require('google-sheets-bulk-writer');
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CONFIG,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const bulkWriter = new BulkWriter({
    auth,
    spreadsheetId: process.env.SPREADSHEET_ID,
});
```

#### Options
| Option           | Type                   | Required | Default       | Description              |
| ---------------- | ---------------------- | -------- | ------------- | ------------------------ |
| auth             | google.auth.GoogleAuth | Yes      |               | Required to use the [Google Sheets API documentation](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/googleauthoptions).             |
| spreadsheetId    | String                 | Yes      |               | Google Sheets identifier |
| interval         | Number                 | No       | 30000ms       | The interval at which to append to the spreadsheet |
| valueInputOption | String                 | No       | USER_ENTERED  | See [Google Sheets API documentation](https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption) |
| insertDataOption | String                 | No       | INSERT_ROWS   | See [Google Sheets API documentation](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append#InsertDataOption) |
| errorHandler     | Function               | No       | console.error | Handler to catch errors returned by the Google Sheets API |

### Use
```javascript
bulkWriter.setErrorHandler((err) => {
    console.log(`Failed to write values to spreadsheet`);
    console.log(JSON.stringify(bulkWriter.getErrorValues(), null, 4));

    bulkWriter.clearErrorValues();
});

bulkWriter.start();

bulkWriter.append(`A:H`, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
bulkWriter.append(`A:H`, ['b', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
bulkWriter.append(`Sheet2!A:H`, ['c', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);

setTimeout(() => {
    bulkWriter.append(`A:H`, ['d', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    bulkWriter.append(`Sheet2!A:H`, ['e', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
}, 25000);

```



### API
#### start()
Required to start the recurring bulk write.

#### stop()
If the bulk write needs to be stopped for whatever reason.

#### restart()
Calls `stop()` and then `start()`. This needs to be called if a new `interval` is set.

#### append(range, values)
Adds a row to be appended to the spreadsheet.
`range` is expected to be a string. The sheetId is specified in the range. See [Google Sheets API documentation](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append) for more information.
`values` is a two-dimensional array of values to be appended to the spreadsheet.

#### flush()
This gets automatically called every `interval` amount of time, but it is available to be used manually as well.

#### write(range, values)
This is a wrapper function for `google.sheets.spreadsheets.values.append()`. It gets automatically called by the `flush()` functin.

#### getInterval()
Retrieve the `interval` option value.

#### setInterval(interval)
Set a new `interval` value. Expects an integer as the parameter.

#### getCache()
Retrieve the values set to be posted to a spreadsheet. `cache` is an object with key values of different ranges. Allows for posting to multiple tabs.

#### clearRangeQueue(range)
Clears a single range field in the `cache` object. Expects a string as the parameter.

#### clearCache()
Resets the `cache` object.

#### getErrorValues()

#### clearErrorValues()

#### setErrorHandler(errorHandler)
Allows for custom handling of Google Sheets API errors. Expects a function as the parameter.

