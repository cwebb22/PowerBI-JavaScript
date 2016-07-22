$(function () {
  var models = window['powerbi-client'].models;

  // Other
  var apiBaseUrl = 'http://powerbipaasapi.azurewebsites.net/api';
  var allReportsUrl = apiBaseUrl + '/reports';
  var staticReportId = '5dac7a4a-4452-46b3-99f6-a25915e0fe55';
  var staticReportUrl = allReportsUrl + '/' + staticReportId;

  // Scenario 1: Static Embed
  var $staticReportContainer = $('#reportstatic');

  // Scenario 2: Dynamic Embed
  var $reportsList = $('#reportslist');
  var $dynamicReportContainer = $('#reportdynamic');

  // Scenario 3: Custom Page Navigation
  var $customPageNavContainer = $('#reportcustompagenav');
  var customPageNavReport;
  var $reportPagesList = $('#reportpagesbuttons');

  // Scenario 4: Custom Filter Pane
  var $customFilterPaneContainer = $('#reportcustomfilter');
  var customFilterPaneReport;

  // Scenario 5: Default Page and/or Filter
  var $defaultPageReportContainer = $('#reportdefaults');
  var defaultPageReport;
  var defaultPageName = 'ReportSection2';
  var defaultFilter = new models.AdvancedFilter({
    table: "Store",
    column: "Name"
  }, "Or", [
      {
        operator: "Contains",
        value: "Wash"
      },
      {
        operator: "Contains",
        value: "Park"
      }
    ]);

  /**
   * This is temporarily hard code so we can load reports from the pre-production environment for testing out new features.
   */
  var localReportOverride = {
    embedUrl: 'https://portal.analysis.windows-int.net/appTokenReportEmbed?unmin=true',
    id: 'c4d31ef0-7b34-4d80-9bcb-5974d1405572',
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIwLjEuMCIsImF1ZCI6Imh0dHBzOi8vYW5hbHlzaXMud2luZG93cy5uZXQvcG93ZXJiaS9hcGkiLCJpc3MiOiJQb3dlckJJU0RLIiwidHlwZSI6ImVtYmVkIiwid2NuIjoiV2FsbGFjZSIsIndpZCI6IjUyMWNkYTJhLTRlZDItNDg5Ni1hYzA0LWM5YzM4MWRjMjUyYSIsInJpZCI6ImM0ZDMxZWYwLTdiMzQtNGQ4MC05YmNiLTU5NzRkMTQwNTU3MiIsIm5iZiI6MTQ2ODYyNDc3NCwiZXhwIjoxNDY4NjI4Mzc0fQ.o3RnWzxQxoy3hpFs27Gx5NauZZ-gzbNfMSFfcWEReN4'
  };

  /**
   * Load 
   */
  fetch(staticReportUrl)
    .then(function (response) {
      if (response.ok) {
        return response.json()
          .then(function (report) {
            /**
             * Basic Embed
             */
            var reportConfig = $.extend({
              type: 'report',
              settings: {
                filterPaneEnabled: false,
                navContentPaneEnabled: false
              }
            }, report, localReportOverride);
            var staticReport = powerbi.embed($staticReportContainer.get(0), reportConfig);

            /**
             * Default Page Report
             */
            var defaultPageConfig = $.extend({}, reportConfig, {
              pageName: defaultPageName,
              filter: defaultFilter.toJSON(),
              settings: {
                filterPaneEnabled: true,
                navContentPaneEnabled: true
              }
            });

            var defaultPageReport = powerbi.embed($defaultPageReportContainer.get(0), defaultPageConfig);

            /**
             * Custom Page Navigation Embed
             */
            var customPageNavConfig = $.extend({}, reportConfig, {
              settings: {
                filterPaneEnabled: false,
                navContentPaneEnabled: true
              }
            });

            customPageNavReport = powerbi.embed($customPageNavContainer.get(0), customPageNavConfig);

            customPageNavReport.on('loaded', function (event) {
              console.log('custom page nav report loaded');
              customPageNavReport.getPages()
                .then(function (pages) {
                  console.log('pages: ', pages);
                  if(pages.length > 0) {
                    const firstPage = pages[0];
                    firstPage.isActive = true;

                    pages
                      .map(function (page) {
                        return generateReportPage(page);
                      })
                      .forEach(function (element) {
                        $reportPagesList.append(element);
                      });
                  }
                });
            });

            customPageNavReport.on('error', function (event) {
              console.log('customPageNavReport error', event);
            });

            customPageNavReport.on('pageChanged', function (event) {
              console.log('pageChanged event received', event);
              updateActivePage(event.detail.newPage);
            });

            /**
             * Custom Filter Pane
             */
            var customFilterPaneConfig = $.extend({}, reportConfig, {
              settings: {
                filterPaneEnabled: true,
                navContentPaneEnabled: true
              }
            });

            customFilterPaneReport = powerbi.embed($customFilterPaneContainer.get(0), customFilterPaneConfig);

            customFilterPaneReport.on('loaded', function (event) {
              console.log('custom filter pane report loaded');
              customFilterPaneReport.getPages()
                .then(function (pages) {
                  var $pagesSelect = $('#filtertargetpage');
                  var $removeAllFiltersPagesList = $('#removeAllFiltersPagesList');

                  pages
                    .forEach(function (page) {
                      var $pageOption = $('<option>')
                        .val(page.name)
                        .text(page.displayName);

                      var $pageOption1 = $('<option>')
                        .val(page.name)
                        .text(page.displayName);

                      $removeAllFiltersPagesList.append($pageOption);
                      $pagesSelect.append($pageOption1);
                    });
                });
            });
          });
      }
    });

  fetch(allReportsUrl)
    .then(function (response) {
      if (response.ok) {
        return response.json()
          .then(function (reports) {
            reports
              .map(generateReportListItem)
              .forEach(function (element) {
                $reportsList.append(element);
              });
          });
      }
    });

  function updateActivePage(newPage) {
    // Remove active class
    var reportButtons = $reportPagesList.children('button');

    reportButtons
      .each(function (index, element) {
        var $element = $(element);
        var buttonPage = $element.data('page');
        if(buttonPage.isActive) {
          buttonPage.isActive = false;
          $element.removeClass('active');
        }
      });

    // Set active class
    reportButtons
      .each(function (index, element) {
        var $element = $(element);
        var buttonPage = $element.data('page');
        if(buttonPage.name === newPage.name) {
          buttonPage.isActive = true;
          $element.addClass('active');
        }
      });
  }

  function generateReportListItem(report) {
    var button = $('<button>')
      .attr({
        type: 'button'
      })
      .addClass('btn btn-success')
      .data('report', report)
      .text('Embed!');

    var reportName = $('<span />')
      .addClass('report-name')
      .text(report.name)

    var element = $('<li>')
      .append(reportName)
      .append(button);

    return element;
  }

  function generateReportPage(page) {
    var $page = $('<button>')
      .attr({
        type: 'button'
      })
      .addClass('btn btn-success')
      .data('page', page)
      .text(page.displayName);

    if(page.isActive) {
      $page.addClass('active');
    }

    return $page;
  }

  /**
   * Custom Page Navigation Logic
   */
  (function () {
    var $resetButton = $('#resetButton');
    var $prevButton = $('#prevbutton');
    var $nextButton = $('#nextbutton');
    var $cycleButton = $('#cyclebutton');
    var cycleIntervalId;
    
    // When report button is clicked embed the report
    $reportsList.on('click', 'button', function (event) {
      var button = event.target;
      var report = $(button).data('report');
      var url = apiBaseUrl + '/' + report.id;

      fetch(url)
        .then(function (response) {
          return response.json();
        })
        .then(function (reportWithToken) {
          var reportConfig = $.extend({
              type: 'report',
              settings: {
                filterPaneEnabled: false,
                navContentPaneEnabled: false
              }
          }, reportWithToken, localReportOverride);

          powerbi.embed($dynamicReportContainer.get(0), reportConfig);
        });
    });

    $prevButton.on('click', function (event) {
      changePage(false);
    });

    $nextButton.on('click', function (event) {
      changePage(true);
    });

    $cycleButton.on('click', function (event) {
      $cycleButton.toggleClass('active');
      $cycleButton.data('cycle', !$cycleButton.data('cycle'));

      if($cycleButton.data('cycle')) {
        cycleIntervalId = setInterval(function () {
          console.log('cycle page: ');
          changePage(true);
        }, 1000);
      }
      else {
        clearInterval(cycleIntervalId);
      }
    });

    $resetButton.on('click', function (event) {
      powerbi.reset($dynamicReportContainer.get(0));
    });

    $reportPagesList.on('click', 'button', function (event) {
      var button = event.target;
      var report = $(button).data('report');
      var page = $(button).data('page');

      console.log('Attempting to set page to: ', page.name);
      customPageNavReport.setPage(page.name)
        .then(function (response) {
          console.log('Page changed request accepted');
        });
    });

    function changePage(forwards) {
      // Remove active class
      var reportButtons = $reportPagesList.children('button');
      var $activeButtonIndex = -1;

      reportButtons
        .each(function (index, element) {
          var $element = $(element);
          var buttonPage = $element.data('page');
          if(buttonPage.isActive) {
            $activeButtonIndex = index;
          }
        });

      if(forwards) {
        $activeButtonIndex += 1;
      }
      else {
        $activeButtonIndex -= 1;
      }

      if($activeButtonIndex > reportButtons.length - 1) {
        $activeButtonIndex = 0;
      }
      if($activeButtonIndex < 0) {
        $activeButtonIndex = reportButtons.length - 1;
      }

      reportButtons
        .each(function (index, element) {
          if($activeButtonIndex === index) {
            var $element = $(element);
            var buttonPage = $element.data('page');
            
            customPageNavReport.setPage(buttonPage.name);
          }
        });
    }
  })();

  /**
   * Custom Filter Pane
   */
  (function () {
    var $customFilterForm = $('#customfilterform');
    var $filterType = $('#filtertype');
    var $typeFields = $('.filter-type');
    var $operatorTypeFields = $('input[type=radio][name=operatorType]');
    var $operatorFields = $('.filter-operators');
    var $targetTypeFields = $('input[type=radio][name=filterTarget]');
    var $targetFields = $('.filter-target');

    var $predefinedFilter1 = $('#predefinedFilter1');
    var predefinedFilter1 = new models.AdvancedFilter({
      table: "Store",
      column: "Name"
    }, "Or", [
      {
        operator: "Contains",
        value: "Wash"
      },
      {
        operator: "Contains",
        value: "Park"
      }
    ]);

    var $predefinedFilter2 = $('#predefinedFilter2');
    var predefinedFilter2 = new models.AdvancedFilter({
      table: "Store",
      column: "Name"
    }, "Or", [
      {
        operator: "Contains",
        value: "Wash"
      },
      {
        operator: "Contains",
        value: "Park"
      }
    ]);

    var $predefinedFilter3 = $('#predefinedFilter3');
    var predefinedFilter3 = new models.AdvancedFilter({
      table: "Store",
      column: "Name"
    }, "Or", [
      {
        operator: "Contains",
        value: "Wash"
      },
      {
        operator: "Contains",
        value: "Park"
      }
    ]);
    var predefinedTarget3 = {
      type: "page",
      name: "ReportSection2"
    };

    $customFilterForm.on('submit', function (event) {
      event.preventDefault();
      console.log('submit');

      var data = {
        target: getFilterTypeTarget(),
        operator: getFilterOperatorAndValues(),
        reportTarget: getReportTarget()
      };

      var filter;
      var values = Array.prototype.slice.call(data.operator.values);

      if (data.operator.type === "basic") {
        filter = new models.ValueFilter(data.target, data.operator.operator, values);
      }
      else if (data.operator.type === "advanced") {
        filter = new models.AdvancedFilter(data.target, data.operator.operator, values);
      }

      var target;
      if ((data.reportTarget.type === "page")
        || (data.reportTarget.type === "visual")) {
        target = data.reportTarget;
      }

      var filterJson = filter.toJSON();

      customFilterPaneReport.addFilter(filterJson, target);
    });

    $filterType.on('change', function (event) {
      console.log('change');
      var value = $filterType.val().toLowerCase();
      updateFieldsForType(value);
    });

    $operatorTypeFields.on('change', function (event) {
      var checkedType = $('#customfilterform input[name=operatorType]:checked').val();
      console.log('operator change', checkedType);
      
      updateFieldsForOperator(checkedType.toLowerCase());
    });

    $targetTypeFields.on('change', function (event) {
      var checkedTarget = $('#customfilterform input[name=filterTarget]:checked').val();
      console.log('target change', checkedTarget);
      
      updateTargetFields(checkedTarget.toLowerCase());
    });

    $predefinedFilter1.on('click', function (event) {
      customFilterPaneReport.addFilter(predefinedFilter1);
    });

    $predefinedFilter2.on('click', function (event) {
      customFilterPaneReport.addFilter(predefinedFilter2);
    });

    $predefinedFilter3.on('click', function (event) {
      customFilterPaneReport.addFilter(predefinedFilter3, predefinedTarget3);
    });

    function getFilterTypeTarget() {
      var filterType = $filterType.val().toLowerCase();
      var filterTypeTarget = {};
      filterTypeTarget.table = $('#filtertable').val();

      if(filterType === "column") {
        filterTypeTarget.column = $('#filtercolumn').val();
      }
      else if(filterType === "hierarchy") {
        filterTypeTarget.hierarchy = $('#filterhierarchy').val();
        filterTypeTarget.hierarchyLevel = $('#filterhierarchylevel').val();
      }
      else if(filterType === "measure") {
        filterTypeTarget.measure = $('#filtermeasure').val();
      }

      return filterTypeTarget;
    }

    function getFilterOperatorAndValues() {
      var operatorType = $('#customfilterform input[name=operatorType]:checked').val();
      var operatorAndValues = {
        type: operatorType
      };

      if (operatorType === "basic") {
        operatorAndValues.operator = $('#filterbasicoperator').val();
        operatorAndValues.values = $('.basic-value').map(function (index, element) {
          return $(element).val();
        });
      }
      else if (operatorType === "advanced") {
        operatorAndValues.operator = $('#filterlogicaloperator').val();
        operatorAndValues.values = $('.advanced-value')
          .map(function (index, element) {
            return {
              value: $(element).find('.advanced-value-input').val(),
              operator: $(element).find('.advanced-logical-condition').val()
            };
          });
      }

      return operatorAndValues;
    }

    function getReportTarget() {
      var checkedTarget = $('#customfilterform input[name=filterTarget]:checked').val();
      var target = {
        type: checkedTarget
      };
      
      if (checkedTarget === "page") {
        target.name = $('#filtertargetpage').val();
      }
      else if (checkedTarget === "visual") {
        target.id = undefined; // Need way to populate visual ids
      }

      return target;
    }

    function updateFieldsForType(type) {
      $typeFields.hide();
      $('.filter-type--' + type).show();
    }

    function updateFieldsForOperator(type) {
      $operatorFields.hide();
      $('.filter-operators--' + type).show();
    }

    function updateTargetFields(target) {
      $targetFields.hide();
      $('.filter-target--' + target).show();
    }

    // Init
    updateFieldsForType("column");
    updateFieldsForOperator("basic");
    updateTargetFields("report");
  })();

  /**
   * Remove Filters Buttons
   */
  (function () {
    var $removeAllFiltersReportForm = $('#removeAllFiltersReportForm');
    var $removeAllFiltersPageForm = $('#removeAllFiltersPageForm');
    var $removeAllFiltersVisualForm = $('#removeAllFiltersVisualForm');
    var $removeAllFiltersPagesList = $('#removeAllFiltersPagesList');
    var $removeAllFiltersVisualsList = $('#removeAllFiltersVisualsList');

    $removeAllFiltersReportForm.on('submit', function (event) {
      event.preventDefault();

      console.log('submit removeAllFiltersReportForm');
      customFilterPaneReport.removeAllFilters();
    });

    $removeAllFiltersPageForm.on('submit', function (event) {
      event.preventDefault();

      var pageName = $removeAllFiltersPagesList.val();
      var target = {
        type: "page",
        name: pageName
      };

      console.log('submit removeAllFiltersPageForm', pageName);
      customFilterPaneReport.removeAllFilters(target);
    });

    $removeAllFiltersVisualForm.on('submit', function (event) {
      event.preventDefault();

      var visualId = $removeAllFiltersVisualsList.val();
      var target = {
        type: "visual",
        id: visualId
      };

      console.log('submit removeAllFiltersVisualForm', visualId);
      customFilterPaneReport.removeAllFilters(target);
      
    });
  })();
});