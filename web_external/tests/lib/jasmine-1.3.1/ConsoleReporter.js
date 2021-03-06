/**
 Jasmine Reporter that outputs test results to the browser console.
 Useful for running in a headless environment such as PhantomJs, ZombieJs etc.

 Usage:
 // From your html file that loads jasmine:
 jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
 jasmine.getEnv().execute();
*/
(function (jasmine, console) {
    if (!jasmine) {
        throw "jasmine library isn't loaded!";
    }

    var ANSI = {};
    ANSI.color_map = {
        'green': 32,
        'red': 31
    };

    ANSI.colorize_text = function (text, color) {
        var color_code = this.color_map[color];
        return "\033[" + color_code + "m" + text + "\033[0m";
    };

    var ConsoleReporter = function () {
        if (!console || !console.log) {
            throw "console isn't present!";
        }
        this.status = this.statuses.stopped;
    };

    var proto = ConsoleReporter.prototype;
    proto.statuses = {
        stopped: 'stopped',
        running: 'running',
        fail: 'fail',
        success: 'success'
    };

    proto._printStackTrace = function (stackArray) {
        _.each(stackArray, function (frame) {
            if (frame.sourceURL.indexOf('testing.min.js') === -1) {
                this.log('    at ' + frame.sourceURL + ' line ' + frame.line, 'red');
            }
        }, this);
    };

    proto.reportRunnerStarting = function (runner) {
        this.status = this.statuses.running;
        this.start_time = (new Date()).getTime();
        this.executed_specs = 0;
        this.passed_specs = 0;

        this.log('-----------------------');
        this.log('Jasmine runner starting');
        this.log('-----------------------');
    };

    proto.reportRunnerResults = function (runner) {
      var failed = this.executed_specs - this.passed_specs;
      var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
      var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
      var color = (failed > 0)? "red" : "green";
      var dur = (new Date()).getTime() - this.start_time;

      this.log("----------------");
      this.log("Testing Finished");
      this.log("----------------");
      this.log(spec_str + fail_str + (dur/1000) + "s.", color);

      this.status = (failed > 0)? this.statuses.fail : this.statuses.success;

      /* Print something that signals that testing is over so that headless browsers
         like PhantomJs know when to terminate. */
      this.log("");
      this.log("ConsoleReporter finished");
    };


    proto.reportSpecStarting = function(spec) {
        this.executed_specs++;
    };

    proto.reportSpecResults = function(spec) {
        if (spec.results().passed()) {
            this.log('. ' + spec.suite.description + ' -> ' + spec.description, 'green');
            this.passed_specs++;
            return;
        }

        var resultText = 'F ' + spec.suite.description + ' -> ' + spec.description;
        this.log(resultText, 'red');

        var items = spec.results().getItems();
        _.each(items, function (item) {
            if (!item.passed()) {
                this.log('\n Error: ' + item.message, 'red');
                this._printStackTrace(item.trace.stackArray);
                console.log('__SCREENSHOT__' + spec.description.replace(/ /g, "_") + ".png");
            }
        }, this);
    };

    proto.reportSuiteResults = function (suite) {
        var results = suite.results();
        var failed = results.totalCount - results.passedCount;
        var color = (failed > 0) ? "red" : "green";
        this.log('');
        this.log(suite.description + ': ' + results.passedCount + " of " +
                 results.totalCount + " passed.", color);
    };

    proto.log = function (str, color) {
        var text = (color !== undefined)? ANSI.colorize_text(str, color) : str;
        console.log(text);
    };

    jasmine.ConsoleReporter = ConsoleReporter;
})(jasmine, console);
