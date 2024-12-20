(function ($) {

    Drupal.behaviors.rsf2 = {
        attach: function (context) {

            if (!Drupal.settings.mywebform.preview) {
                var periodInfo = Drupal.settings.mywebform.period;
                $("#dec_period_from").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_from").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));

                $("#dec_period_to").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_to").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));
            }

            $("#dec_period_to").on("change", function () {
                var val = $(this).val();
                var year = "";

                if (val) {
                    var periodArr = val.split(".");
                    if (periodArr.length === 3) {
                        year = periodArr[2];
                    }
                }

                $("#nalogPeriodYear").val(year).trigger("change");
            });

            jQuery('#mywebform-edit-form').on('keypress', 'input.numeric, input.float, input.money', function (event) {
                var allowNegative = jQuery(this).attr('allow-negative') || false;
                if (isNumberPressed(this, event, allowNegative) === false) {
                    event.preventDefault();
                }
            });

            jQuery('#mywebform-edit-form', context).on('paste', 'input.numeric, input.money, input.float', function (event) {
                var obj = event.originalEvent || event;

                if (typeof obj.clipboardData !== 'undefined') {
                    var value = obj.clipboardData.getData('text/plain');
                    var number = Number(value);
                    var isNotNumber = isNaN(number);

                    if (jQuery(this).hasClass('allow-negative')) {
                        if (isNotNumber) {
                            event.preventDefault();
                        }
                    } else {
                        if (isNotNumber || is_negative(number)) {
                            event.preventDefault();
                        }
                    }
                }
            });
        }
    };

    webform.beforeLoad.rsf2 = function () {
        $('#dinamicAttachments').on('mywebform:showFileInfo', '.mywebform-file-widget', function () {
            $(this).parents('div.row').find('.delrow').show();
        });

        $('#dinamicAttachments').on('mywebform:sync', '.mywebform-file-widget', function () {
            var length = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file.length;
            if (Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file[length - 1] != '') {
                $('#dinamicAttachments .grid-addrow').trigger('click');
            }
        });
    };

    webform.afterLoad.rsf2 = function () {
        if (Drupal.settings.mywebform.preview && !Drupal.settings.mywebform.values.dec_lichidare) {
            $(".lichidare").hide();
        }
    };

    webform.validators.rsf2 = function () {
        var values = Drupal.settings.mywebform.values;

        //--------------------------------------------

        var fieldError = validateFieldNoHieroglyphs('Entitatea', values.dec_fiscCod_name);
        if (fieldError) {
            webform.errors.push({
                'fieldName': fieldError.fieldName,
                'index': 0,
                'weight': 10,
                'msg': fieldError.message
            });
        }
        //--------------------------------------------
        var dateObj = new Date();
        var value1, value2;

        var objFieldsTable1 = {};
        var objFieldsTable2 = {};
        var objFieldsTable3 = {};

        for (var field in values) {

            // Scoatem valorile cimpurilor doar din tabelul 1(Anexa nr.3)
            if (field.match(/^dec_table1_row_r/)) {
                objFieldsTable1[field] = Number(values[field]);
            }

            // Scoatem valorile cimpurilor doar din tabelul 2(Anexa nr.1)
            if (field.match(/^dec_table2_row_r/)) {
                objFieldsTable2[field] = Number(values[field]);
            }

            // Scoatem valorile cimpurilor doar din tabelul 3(Anexa nr.2)
            if (field.match(/^dec_table3_row_r/)) {
                objFieldsTable3[field] = Number(values[field]);
            }
        }

        var lengthObjFieldsTable1 = Object.keys(objFieldsTable1).length;
        var lengthObjFieldsTable2 = Object.keys(objFieldsTable2).length;
        var lengthObjFieldsTable3 = Object.keys(objFieldsTable3).length;

        // Daca in antet, in campul "Forma organizatorico-juridică" nu este una dintre valorile: 871, 890, 899, 900, 930, 700, 940, 970, 910, 960 afisam eroare
        var CfojValues = [871, 890, 899, 900, 930, 700, 940, 970, 910, 960];
        var nrCfoj = Number(values.dec_fiscCod_cfoj);

        if (CfojValues.indexOf(nrCfoj) === -1) {
            webform.errors.push({
                "fieldName": "dec_fiscCod_cfoj",
                "weight": 1,
                "msg": concatMessage('RF2-001', '', Drupal.t('Dacă forma organizatorico-juridică ≠ @codes – entitatea prezintă raportul "situaţii financiare conform SNC"', {
                    '@codes': CfojValues.join(', ')
                }))
            });
        }

        var prevYear = dateObj.getFullYear() - 1;
        var currentDate = new Date();
        var validDate = new Date(prevYear, 11, 181, 23, 59, 59); // prevYear/12/31 + 150 days
        var minDate = new Date(prevYear, 0, 1).getTime();
        var maxDate = new Date(prevYear, 11, 31).getTime();
        var periodFromArr = values.dec_period_from.split(".");
        var periodToArr = values.dec_period_to.split(".");

        if (periodFromArr.length == 3 && periodToArr.length == 3) {
            var fromDate = new Date(periodFromArr[2], periodFromArr[1] - 1, periodFromArr[0]);
            var toDate = new Date(periodToArr[2], periodToArr[1] - 1, periodToArr[0]);

            var diffDays = Math.ceil(Math.abs(toDate.getTime() - fromDate.getTime()) / (86400000));
            var currentYear = new Date().getFullYear();
            if ((isLeap(currentYear) && diffDays > 366) || (!isLeap(currentYear) && diffDays > 365)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 33,
                    'msg': concatMessage('RF2-033', '', Drupal.t('Perioada de raportare este mai mare de un an')),
                });
            }
        }

        if (periodToArr.length == 3) {
            var periodToStr = periodToArr[2] + '-' + periodToArr[1] + '-' + periodToArr[0];
            var lastYear = new Date().getFullYear() - 1;
            var comparedDateStr = lastYear + '-12-31';
            if ((values.dec_lichidare && periodToStr >= comparedDateStr) || (!values.dec_lichidare && periodToStr != comparedDateStr)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 32,
                    'msg': concatMessage('RF2-032', '', Drupal.t('Data sfirsitului perioadei de raportare nu este corecta')),
                });
            }
        }

        if (Drupal.settings.declarations.declarations_submission_deadline_rsf2 && currentDate > validDate) {
            webform.errors.push({
                'fieldName': 'dec_period_from',
                'index': 0,
                'weight': 2,
                'msg': concatMessage('RF2-002', '', Drupal.t('Termenul prezentarii a Situatiilor financiare a expirat')),
            });
        }

        var fromDateTimeStamp = new Date(Number(periodFromArr[2]), (Number(periodFromArr[1]) - 1), Number(periodFromArr[0])).getTime();
        var toDateTimeStamp = new Date(Number(periodToArr[2]), (Number(periodToArr[1]) - 1), Number(periodToArr[0])).getTime();

        if ((Number(values.dec_table2_row_r390c4) != Number(values.dec_table2_row_r310c4) + Number(values.dec_table2_row_r320c4) + Number(values.dec_table2_row_r330c4) + Number(values.dec_table2_row_r340c4) + Number(values.dec_table2_row_r350c4) + Number(values.dec_table2_row_r360c4) + Number(values.dec_table2_row_r370c4) + Number(values.dec_table2_row_r380c4)) || (Number(values.dec_table2_row_r390c5) != Number(values.dec_table2_row_r310c5) + Number(values.dec_table2_row_r320c5) + Number(values.dec_table2_row_r330c5) + Number(values.dec_table2_row_r340c5) + Number(values.dec_table2_row_r350c5) + Number(values.dec_table2_row_r360c5) + Number(values.dec_table2_row_r370c5) + Number(values.dec_table2_row_r380c5))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 35,
                "msg": concatMessage('RF2-035', '', Drupal.t("Anexa1 rd.390 col.4,5 = rd.310 + rd.320 + rd.330 + rd.340 + rd.350 + rd.360  + rd.370 + rd.380 col.4,5"))
            });
        }

        if ((Number(values.dec_table2_row_r400c4) != Number(values.dec_table2_row_r260c4) + Number(values.dec_table2_row_r300c4) + Number(values.dec_table2_row_r390c4)) || (Number(values.dec_table2_row_r400c5) != Number(values.dec_table2_row_r260c5) + Number(values.dec_table2_row_r300c5) + Number(values.dec_table2_row_r390c5))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 36,
                "msg": concatMessage('RF2-036', '', Drupal.t("Anexa1 rd.400 col.4,5 = rd.260 + rd.300 +  rd.390  col.4,5"))
            });
        }

        if ((Number(values.dec_table2_row_r070c4) != Number(values.dec_table2_row_r010c4) + Number(values.dec_table2_row_r020c4) + Number(values.dec_table2_row_r030c4) + Number(values.dec_table2_row_r040c4) + Number(values.dec_table2_row_r050c4) + Number(values.dec_table2_row_r060c4)) || (Number(values.dec_table2_row_r070c5) != Number(values.dec_table2_row_r010c5) + Number(values.dec_table2_row_r020c5) + Number(values.dec_table2_row_r030c5) + Number(values.dec_table2_row_r040c5) + Number(values.dec_table2_row_r050c5) + Number(values.dec_table2_row_r060c5))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 30,
                "msg": concatMessage('RF2-030', '', Drupal.t("Anexa1 rd.070 col.4,5 = rd.010 + rd.020 + rd.030 + rd.040 + rd.050 + rd.060 col.4,5"))
            });
        }

        if ((Number(values.dec_table3_row_r030c3) != Number(values.dec_table3_row_r010c3) - Number(values.dec_table3_row_r020c3)) || (Number(values.dec_table3_row_r030c4) != Number(values.dec_table3_row_r010c4) - Number(values.dec_table3_row_r020c4))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 38,
                "msg": concatMessage('RF2-038', '', Drupal.t("Anexa2 rd.030 col.3,4 = rd.010 - rd.020 col.3,4"))
            });
        }

        if ((Number(values.dec_table3_row_r060c3) != Number(values.dec_table3_row_r040c3) - Number(values.dec_table3_row_r050c3)) || (Number(values.dec_table3_row_r060c4) != Number(values.dec_table3_row_r040c4) - Number(values.dec_table3_row_r050c4))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 39,
                "msg": concatMessage('RF2-039', '', Drupal.t("Anexa2 rd.060 col.3,4 = rd.040 - rd.050 col.3,4"))
            });
        }

        if ((Number(values.dec_table3_row_r090c3) != Number(values.dec_table3_row_r070c3) - Number(values.dec_table3_row_r080c3)) || (Number(values.dec_table3_row_r090c4) != Number(values.dec_table3_row_r070c4) - Number(values.dec_table3_row_r080c4))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 40,
                "msg": concatMessage('RF2-040', '', Drupal.t("Anexa2 rd.090 col.3,4 = rd.070 - rd.080 col.3,4"))
            });
        }

        if ((Number(values.dec_table3_row_r110c3) != Number(values.dec_table3_row_r030c3) + Number(values.dec_table3_row_r060c3) + + Number(values.dec_table3_row_r090c3) - Number(values.dec_table3_row_r100c3)) || (Number(values.dec_table3_row_r110c4) != Number(values.dec_table3_row_r030c4) + Number(values.dec_table3_row_r060c4) + Number(values.dec_table3_row_r090c4) - Number(values.dec_table3_row_r100c4))) {
            webform.errors.push({
                "fieldName": "",
                "weight": 41,
                "msg": concatMessage('RF2-041', '', Drupal.t("Anexa2 rd.110 col.3,4 = rd.030 + rd.060 + rd.090 - rd.100 col.3,4"))
            });
        }

        if (values.dec_lichidare) {
            if (Number(values.dec_table2_row_r400c5) > 0) {
                webform.errors.push({
                    "fieldName": "dec_table2_row_r400c5",
                    "weight": 34,
                    "msg": concatMessage('RF2-034', '', Drupal.t("Situatia financiare nu corespunde bilantului de lichidare nu Functioneaza"))
                });
            }

            if (toDateTimeStamp == maxDate || toDateTimeStamp < minDate) {
                webform.errors.push({
                    "fieldName": "dec_period_to",
                    "weight": 51,
                    "msg": concatMessage('RF2-051', '', Drupal.t("Data sfîrșitului perioadei de raportare nu este corectă"))
                });
            }
        } else {
            if (toDateTimeStamp != maxDate) {
                webform.errors.push({
                    "fieldName": "dec_period_to",
                    "weight": 51,
                    "msg": concatMessage('RF2-051', '', Drupal.t("Data sfîrșitului perioadei de raportare nu este corectă"))
                });
            }
        }

        // Daca intervalul indicat in "pentru perioada " este mai mare de 365, afisam mesaj informativ
        if (values.dec_period_from !== "" && values.dec_period_to !== "") {
            var fromDateArr = values.dec_period_from.split(".");
            var ToDateArr = values.dec_period_to.split(".");

            var fromDate = new Date(Number(fromDateArr[2]), (Number(fromDateArr[1]) - 1), Number(fromDateArr[0]));
            var toDate = new Date(Number(ToDateArr[2]), (Number(ToDateArr[1]) - 1), Number(ToDateArr[0]));

            var countDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));

            if (countDays > 365) {
                webform.errors.push({
                    "fieldName": "dec_period_to",
                    "weight": 52,
                    "msg": concatMessage('RF2-052', '', Drupal.t("The reporting period is longer than one year"))
                });
            }
        }

        if (parseInt(periodFromArr[2]) < (dateObj.getFullYear() - 1)) {
            webform.errors.push({
                'fieldName': 'dec_period_from',
                'index': 0,
                'weight': 50,
                'msg': concatMessage('RF2-050', '', Drupal.t("Data inceputului perioadei de raportare nu este corecta")),
            });
        }

        var firstEntry = true;
        jQuery('.positiv input').each(function () {
            var fieldName = jQuery(this).attr("field");

            if (toFloat(Drupal.settings.mywebform.values[fieldName]) < 0) {
                webform.errors.push({
                    'fieldName': fieldName,
                    'index': 0,
                    'weight': 9,
                    'msg': '',
                });
                if (firstEntry) {
                    webform.errors.push({
                        'fieldName': '',
                        'index': 0,
                        'weight': 9,
                        'msg': concatMessage('RF2-009', '', Drupal.t('Anexa 1 valoarea trebuie sa fie pozitivă')),
                    });
                    firstEntry = false;
                }
            }
        });

        var firstEntryAnexa2 = true;
        jQuery('.positiv-anexa2 input').each(function () {
            var fieldName = jQuery(this).attr("field");

            if (toFloat(Drupal.settings.mywebform.values[fieldName]) < 0) {
                webform.errors.push({
                    'fieldName': fieldName,
                    'index': 0,
                    'weight': 24,
                    'msg': '',
                });
                if (firstEntryAnexa2) {
                    webform.errors.push({
                        'fieldName': '',
                        'index': 0,
                        'weight': 24,
                        'msg': concatMessage('RF2-024', '', Drupal.t('Anexa 2 valoarea trebuie sa fie pozitivă')),
                    });
                    firstEntryAnexa2 = false;
                }
            }
        });

        var r140c4 = formatNumber(values.dec_table2_row_r140c4, 0);
        var r141c4 = formatNumber(values.dec_table2_row_r141c4, 0);
        if (toFloat(r140c4) < toFloat(r141c4)) {
            webform.errors.push({
                "fieldName": "dec_table2_row_r140c4",
                "weight": 10,
                "msg": concatMessage('RF2-010', '', Drupal.t("Anexa 1 rd.140 col.4 >= rd.141 col.4, (@val1 ; @val2)", {
                    '@val1': r140c4,
                    '@val2': r141c4
                }))
            });
        }

        var r140c5 = formatNumber(values.dec_table2_row_r140c5, 0);
        var r141c5 = formatNumber(values.dec_table2_row_r141c5, 0);
        if (toFloat(r140c5) < toFloat(r141c5)) {
            webform.errors.push({
                "fieldName": "dec_table2_row_r140c5",
                "weight": 10,
                "msg": concatMessage('RF2-010', '', Drupal.t("Anexa 1 rd.140 col.5 >= rd.141 col.5, (@val1 ; @val2)", {
                    '@val1': r140c5,
                    '@val2': r141c5
                }))
            });
        }

        var r190c4 = formatNumber(values.dec_table2_row_r190c4, 0);
        var r400c4 = formatNumber(values.dec_table2_row_r400c4, 0);
        if (toFloat(r190c4) !== toFloat(r400c4)) {
            webform.errors.push({
                "fieldName": "dec_table2_row_r190c4",
                "weight": 11,
                "msg": concatMessage('RF2-011', '', Drupal.t("Anexa 1 rd.190 col.4 = rd.400 col.4, (@val1 ; @val2)", {
                    '@val1': r190c4,
                    '@val2': r400c4
                }))
            });
        }

        var r190c5 = formatNumber(values.dec_table2_row_r190c5, 0);
        var r400c5 = formatNumber(values.dec_table2_row_r400c5, 0);
        if (toFloat(r190c5) !== toFloat(r400c5)) {
            webform.errors.push({
                "fieldName": "dec_table2_row_r190c5",
                "weight": 11,
                "msg": concatMessage('RF2-011', '', Drupal.t("Anexa 1 rd.190 col.5 = rd.400 col.5, (@val1 ; @val2)", {
                    '@val1': r190c5,
                    '@val2': r400c5
                }))
            });
        }

        var r110c4 = formatNumber(values.dec_table3_row_r110c4, 0);
        var r210c5 = formatNumber(values.dec_table2_row_r210c5, 0);
        if (toFloat(r110c4) !== toFloat(r210c5)) {
            webform.errors.push({
                "fieldName": "dec_table3_row_r110c4",
                "weight": 12,
                "msg": concatMessage('RF2-012', '', Drupal.t("The net surplus in the statement of income and expense (rd.110 col.4) must be equal to the Net Surplus (Net Deficit) of the Balance Sheet (rd.210 col.5), (@val1 ; @val2)", {
                    '@val1': r110c4,
                    '@val2': r210c5
                }))
            });
        }

        var r060c4 = toFloat(values.dec_table1_row_r060c4);
        var summ = formatNumber(toFloat(values.dec_table2_row_r270c4) + toFloat(values.dec_table2_row_r310c4), 0);
        if (toFloat(r060c4) != toFloat(summ)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r060c4",
                "weight": 13,
                "msg": concatMessage('RF2-013', '', Drupal.t("Anexa 3 rd.060 col.4 = Anexa 1 rd.(270 + 310) col.4, (@val1 ; @val2)", {
                    '@val1': r060c4,
                    '@val2': summ
                }))
            });
        }

        var r060c7 = formatNumber(toFloat(values.dec_table1_row_r060c7), 0);
        var summ = formatNumber(toFloat(values.dec_table2_row_r270c5) + toFloat(values.dec_table2_row_r310c5), 0);
        if (toFloat(r060c7) !== toFloat(summ)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r060c7",
                "weight": 14,
                "msg": concatMessage('RF2-014', '', Drupal.t("Anexa 3 rd.060 col.7 = Anexa 1 rd.(270 + 310) col.5, (@val1 ; @val2)", {
                    '@val1': r060c7,
                    '@val2': summ
                }))
            });
        }

        var r140c4 = formatNumber(values.dec_table1_row_r140c4, 0);
        var r220c4 = formatNumber(values.dec_table2_row_r220c4, 0);
        if (toFloat(r140c4) !== toFloat(r220c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r140c4",
                "weight": 15,
                "msg": concatMessage('RF2-015', '', Drupal.t("Anexa 3 rd.140 col.4 = Anexa 1 rd.220 col.4, (@val1 ; @val2)", {
                    '@val1': r140c4,
                    '@val2': r220c4
                }))
            });
        }

        var r140c7 = formatNumber(values.dec_table1_row_r140c7, 0);
        var r220c5 = formatNumber(values.dec_table2_row_r220c5, 0);
        if (toFloat(r140c7) !== toFloat(r220c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r140c7",
                "weight": 16,
                "msg": concatMessage('RF2-016', '', Drupal.t("Anexa 3 rd.140 col.7 = Anexa 1 rd.220 col.5, (@val1 ; @val2)", {
                    '@val1': r140c7,
                    '@val2': r220c5
                }))
            });
        }

        var r150c4 = formatNumber(values.dec_table1_row_r150c4, 0);
        var r230c4 = formatNumber(values.dec_table2_row_r230c4, 0);
        if (toFloat(r150c4) !== toFloat(r230c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r150c4",
                "weight": 17,
                "msg": concatMessage('RF2-017', '', Drupal.t("Anexa 3 rd.150 col.4 = Anexa 1 rd.230 col.4, (@val1 ; @val2)", {
                    '@val1': r150c4,
                    '@val2': r230c4
                }))
            });
        }

        var r150c7 = formatNumber(values.dec_table1_row_r150c7, 0);
        var r230c5 = formatNumber(values.dec_table2_row_r230c5, 0);
        if (toFloat(r150c7) !== toFloat(r230c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r150c7",
                "weight": 18,
                "msg": concatMessage('RF2-018', '', Drupal.t("Anexa 3 rd.150 col.7 = Anexa 1 rd.230 col.5, (@val1 ; @val2)", {
                    '@val1': r150c7,
                    '@val2': r230c5
                }))
            });
        }

        var r160c4 = formatNumber(values.dec_table1_row_r160c4, 0);
        var r240c4 = formatNumber(values.dec_table2_row_r240c4, 0);
        if (toFloat(r160c4) !== toFloat(r240c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r160c4",
                "weight": 19,
                "msg": concatMessage('RF2-019', '', Drupal.t("Anexa 3 rd.160 col.4 = Anexa 1 rd.240 col.4, (@val1 ; @val2)", {
                    '@val1': r160c4,
                    '@val2': r220c5
                }))
            });
        }

        value1 = toFloat(values.dec_table1_row_r160c7);
        value2 = formatNumber(toFloat(values.dec_table2_row_r200c5) + toFloat(values.dec_table2_row_r210c5) + toFloat(values.dec_table2_row_r240c5), 0);
        if (toFloat(value1) != toFloat(value2)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r160c7",
                "weight": 21,
                "msg": concatMessage('RF2-020', '', Drupal.t("Anexa 3 rd.160 col.7 = Anexa1 rd.200 + rd.210 + rd.240 col.5", {
                    '@val1': value1,
                    '@val2': value2
                }))
            });
        }

        var r170c4 = formatNumber(values.dec_table1_row_r170c4, 0);
        var r250c4 = formatNumber(values.dec_table2_row_r250c4, 0);
        if (toFloat(r170c4) !== toFloat(r250c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r170c4",
                "weight": 21,
                "msg": concatMessage('RF2-021', '', Drupal.t("Anexa 3 rd.170 col.4 = Anexa 1 rd.250 col.4, (@val1 ; @val2)", {
                    '@val1': r170c4,
                    '@val2': r250c4
                }))
            });
        }

        var r170c7 = formatNumber(values.dec_table1_row_r170c7, 0);
        var r250c5 = formatNumber(values.dec_table2_row_r250c5, 0);
        if (toFloat(r170c7) !== toFloat(r250c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r170c7",
                "weight": 22,
                "msg": concatMessage('RF2-022', '', Drupal.t("Anexa 3 rd.170 col.7 = Anexa 1 rd.250 col.5, (@val1 ; @val2)", {
                    '@val1': r170c7,
                    '@val2': r250c5
                }))
            });
        }

        var r200c4 = formatNumber(values.dec_table1_row_r200c4, 0);
        var r400c4 = formatNumber(values.dec_table2_row_r400c4, 0);
        if (toFloat(r200c4) > toFloat(r400c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r200c4",
                "weight": 28,
                "msg": concatMessage('RF2-028', '', Drupal.t("Anexa 3 rd.200 col.4 <= Anexa 1 rd.400 col.4, (@val1 ; @val2)", {
                    '@val1': r200c4,
                    '@val2': r400c4
                }))
            });
        }

        var r200c7 = formatNumber(values.dec_table1_row_r200c7, 0);
        var r400c5 = formatNumber(values.dec_table2_row_r400c5, 0);
        if (toFloat(r200c7) > toFloat(r400c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r200c7",
                "weight": 28,
                "msg": concatMessage('RF2-028', '', Drupal.t("Anexa 3 rd.200 col.7 <= Anexa 1 rd.400 col.5, (@val1 ; @val2)", {
                    '@val1': r200c7,
                    '@val2': r400c5
                }))
            });
        }

        var countEmptyFieldsTable1 = 0;
        for (var field1 in objFieldsTable1) {
            if (objFieldsTable1[field1] === 0) {
                countEmptyFieldsTable1++;
            }
        }

        if (countEmptyFieldsTable1 === lengthObjFieldsTable1) {
            webform.warnings.push({
                "fieldName": "",
                "weight": 5,
                "msg": concatMessage('RF2-005', '', Drupal.t('Is not completed Annex 3 "Situatia modificarilor surselor de finantare"'))
            });
        }

        var countEmptyFieldsTable2 = 0;
        for (var field2 in objFieldsTable2) {
            if (objFieldsTable2[field2] === 0) {
                countEmptyFieldsTable2++;
            }
        }

        if (countEmptyFieldsTable2 === lengthObjFieldsTable2) {
            webform.warnings.push({
                "fieldName": "",
                "weight": 3,
                "msg": concatMessage('RF2-003', '', Drupal.t('Is not completed Annex 1 "Bilanţul"'))
            });
        }

        var countEmptyFieldsTable3 = 0;
        for (var field3 in objFieldsTable3) {
            if (objFieldsTable3[field3] === 0) {
                countEmptyFieldsTable3++;
            }
        }

        if (countEmptyFieldsTable3 === lengthObjFieldsTable3) {
            webform.warnings.push({
                "fieldName": "",
                "weight": 4,
                "msg": concatMessage('RF2-004', '', Drupal.t('Is not completed Annex 2 "Situația de venituri și cheltuieli"'))
            });
        }

        var autofield_exp = [
            { 'rezField': 'dec_table2_row_r180c4', 'callback': _mywebform_expression_dec_table2_row_r180c4, 'err': '031', 'text': Drupal.t('Anexa 1 rd.180 col.4 = rd.080 + rd.090 + rd.100 + rd.110 + rd.120 + rd.130 + rd.140 + rd.150 + rd.160 + rd.170 col.4') },
            { 'rezField': 'dec_table2_row_r180c5', 'callback': _mywebform_expression_dec_table2_row_r180c5, 'err': '031', 'text': Drupal.t('Anexa 1 rd.180 col.5 = rd.080 + rd.090 + rd.100 + rd.110 + rd.120 + rd.130 + rd.140 + rd.150 + rd.160 + rd.170 col.5') },
        ];

        for (var i = 0; i < autofield_exp.length; i++) {
            validate_autofields(autofield_exp[i]);
        }

        var msg = concatMessage('RF2-027', '', Drupal.t("Toate valorile din Anexa 3 trebuie sa fie pozitive, cu excepția rîndurilor 160, 180 și 190, care pot fi negative"));
        validatePositiveFields('.annex-3', msg, 27);

        var filesExists = false;
        var files = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file;
        for (var i = 0; i < files.length; i++) {
            if (files[i]) {
                filesExists = true;
                break;
            }
        }

        if (!filesExists) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': 6,
                'msg': Drupal.t('Error code: RF2-006, Lipseşte Notă explicativă'),
            });
        }

        if (!values.dec_group2_adres) {
            webform.warnings.push({
                "fieldName": "dec_group2_adres",
                "msg": Drupal.t('Câmpul nu este completat')
            });
        }

        prepare_errors('errors');
        prepare_errors('warnings');

        //Sort warnings & errors
        webform.warnings.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.errors.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.validatorsStatus.rsf2 = 1;
        validateWebform();
    };

    function sort_errors_warinings(a, b) {
        if (!a.hasOwnProperty('weight')) {
            a.weight = 9999;
        }

        if (!b.hasOwnProperty('weight')) {
            b.weight = 9999;
        }

        return toFloat(a.weight) - toFloat(b.weight);
    }

    function prepare_errors(type) {
        var dateFields = {};
        var requiredFields = {};
        var total = webform[type].length;
        var dateError = Drupal.t('Wrong field format: date needed');
        var requiredError = Drupal.t('This field is required');

        for (var i = 0; i < total; i++) {
            var error = webform[type][i];
            var fieldName = error.fieldName;
            var field = Drupal.settings.mywebform.fields.hasOwnProperty(fieldName) ? Drupal.settings.mywebform.fields[fieldName] : false;

            if (field) {
                if (field.type == 'date') {
                    if (error.msg == dateError) {
                        error.msg = '';
                        dateFields[fieldName] = field.title;
                    }
                } else if (field.type == 'period') {
                    error.msg = '';
                }

                if (field.required && error.msg == requiredError) {
                    error.msg = '';
                    requiredFields[fieldName] = field.title;
                }
            }

            if (isErrorMessageWithCode(error.msg)) {
                if (!error.hasOwnProperty('options')) {
                    error.options = {};
                }

                error.options.hide_title = true;
            }
        }

        if (Object.keys(requiredFields).length) {
            var elements = Object.values(requiredFields).join('<br />');

            webform[type].push({
                'fieldName': '',
                'weight': 10000,
                'msg': Drupal.t("<u>Cîmpuri obligatorii pentru completare:</u><br />!fields", { '!fields': elements })
            });
        }

        if (Object.keys(dateFields).length) {
            var elements = Object.values(dateFields).join('<br />');
            webform[type].push({
                'fieldName': '',
                'weight': 10001,
                'msg': Drupal.t("<u>Data trebuie să fie în formatul: ZZ.LL.AAAA, pentru:</u><br />!fields", { '!fields': elements })
            });
        }
    }

    function isErrorMessageWithCode(msg) {
        if (msg) {
            var regexp = /RF2-\d+/;
            if (regexp.test(msg)) {
                return true;
            }
        }

        return false;
    }

    function validate_autofields(item) {
        var values = Drupal.settings.mywebform.values;
        if (item.callback() != values[item.rezField]) {
            webform.errors.push({
                'fieldName': item.rezField,
                'index': 0,
                'weight': parseInt(item.err),
                'msg': concatMessage('RF2-' + item.err, '', item.text)
            });
        }
    }

    function concatMessage(errorCode, fieldTitle, msg) {
        var titleParts = [];

        if (errorCode) {
            titleParts.push(getErrorMessage(errorCode));
        }

        if (fieldTitle) {
            titleParts.push(fieldTitle);
        }

        if (titleParts.length) {
            msg = titleParts.join(', ') + ' - ' + msg;
        }

        return msg;
    }

    function getFieldTitle(field) {
        return Drupal.settings.mywebform.fields[field].title;
    }

    function getErrorMessage(errorCode) {
        return Drupal.t('Error code: @error_code', { '@error_code': errorCode });
    }

    function isLeap(year) {
        return new Date(year, 1, 29).getDate() === 29;
    }

    function validatePositiveFields(selector, msg, weight) {
        var values = Drupal.settings.mywebform.values;
        var error = false;

        jQuery(selector + ' input').each(function () {
            var fieldName = jQuery(this).attr('field');
            var allowNegative = jQuery(this).attr('allow-negative');

            if (!allowNegative && is_negative(values[fieldName])) {
                error = true;
                webform.errors.push({
                    'fieldName': fieldName,
                    'index': 0,
                    'msg': ''
                });
            }
        });

        if (error) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': weight,
                'msg': msg
            });
        }
    }

    //-----------------------------------------------------------------------

    function validateFieldNoHieroglyphs(fieldName, fieldValue) {
        // Define a regular expression to allow only letters, numbers, spaces, and basic punctuation
        var allowedCharacters = /^[a-zA-Z0-9\s.,'-]+$/;

        // Check if the field contains hieroglyphs or unwanted characters
        if (!allowedCharacters.test(fieldValue)) {
            // Add error message
            return {
                fieldName: fieldName,
                message: `Câmpul "${fieldName}" conține caractere nepermise sau hieroglife.`
            };
        }

        // Return null if no errors
        return null;
    }

    //-----------------------------------------------------------------------
})(jQuery);
