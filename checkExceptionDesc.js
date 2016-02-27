/*jshint esversion: 6 */

var fs = require("fs");
var file = "./js_exception_log.db";
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database(file);

db.serialize(function() {
  var keySet = new Set();
  new Promise(function (resolve, reject) {
    db.all("SELECT * FROM SOURCE", function(err, rows) {
      rows.forEach( function (row) {
        var exception;
        try {
          exception = JSON.parse(row.EXCEPTION);
          exception.ERROR_TYPE = exception._error_ || exception._errorType_;
          delete exception._error_;
          delete exception._errorType_;
          row.EXCEPTION = JSON.stringify(exception);
          Object.assign(row, exception);
        } finally {
        }
      });
      resolve(rows);
    });
  })
  .then( function (rows) {
    var newColumns = Array.from(
      rows.reduce( function (set, row) {
        Object.getOwnPropertyNames(row).forEach(function (key) { set.add(key); });
          return set;
      }, new Set())
    );
    db.run(`CREATE TABLE SOURCE_NEW(${newColumns.map(key=>key+' TEXT').join()})`, function (err) {
      var insertStmt = db.prepare(`
        INSERT INTO SOURCE_NEW (${newColumns.join()})
        VALUES (${new Array(newColumns.length).fill('?').join()})
      `);
      rows.forEach(row => insertStmt.run(Array.from(newColumns).map(key => row[key])));
    });

    // db.close();
  } );
  // .then(() => db.close());
});
