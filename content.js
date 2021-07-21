(() => {
	'use strict';

	////////////TEST////////////
	// let toast = (new Toast()).setEffect(Toast.EFFECT_EXPAN).build();
	// console.log(toast);
	// setTimeout(toast.show(), 5000);
	// document.body.appendChild(toast.toast);
	////////////////////////////

	let helper = new Helper();
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		for (let key in changes) {
			let newValue = changes[key].newValue;
			switch(key) {
				case 'reporterName':
					helper.reporterName = newValue;
					console.log('change reporter name = ', newValue);
					break;
			}
		}
	});
	if (location.href.startsWith('https://jira.fr.exalog.net/secure/Tempo.jspa')) {
		let attempt = 0;
		if (location.hash.startsWith('#/my-work/week')) {
			injectWorkLog();
		}
		window.addEventListener('hashchange', function() {
			if (location.hash.startsWith('#/my-work/week')) {
				injectWorkLog();
			}
		});
		// setTimeout(injectWorkLog, 5000);
		function injectWorkLog() {
			// let myWorkLog = document.getElementById('myWorkCalendarContainer');
			// let canvasDays = document.getElementById('canvas-days');
			let calendarListViewDay = document.getElementsByName('calendarListViewDay');
			// console.log('calendarListViewDay =', calendarListViewDay.length);
			if (calendarListViewDay.length == 0 && attempt < 3) {
				attempt++;
				console.log('Retry in 3s, attempting = '+attempt);
				setTimeout(injectWorkLog, 3000);
				return 0;
			}
			attempt = 0; // reset attempt

			//////////Calendar/Header//////////
			function refreshRecommandTime() {
				let calendarCanvasDayHeader = document.getElementsByName('calendarCanvasDayHeader');
				Array.from(calendarCanvasDayHeader).forEach((el) => {
					let logDate = el.querySelector('.sc-jGDUUe');//ex: Sun dd.mm
					let logTime = el.querySelector('.sc-hPZeXZ');//ex: 7h 38m of 7h 30m
					if (logDate && logTime) {
						let [dayOfWeek, date] = logDate.title.split(' ');
						let [day, month] = date.split('.');
						let logged = helper.parseTime(logTime.textContent.split(' of ')[0]);
						let isWeekday = ['Sat', 'Sun'].indexOf(dayOfWeek) === -1;
						let isToday = day == (new Date()).getDate();
						const MIN_TIME = 27000;// 27000s = 450m = 7h 30m
						if (logged < MIN_TIME && isWeekday) {
							logTime.style.color = 'red';
							if (isToday) {
								clearTimeout(window.toTimeInfo);
								let infos = [];
								infos.push(logTime.textContent);
								infos.push(helper.parseHumanReadableTime(MIN_TIME - logged) + ' more');
								infos.push('recommand = ' + helper.getRecommendLogTime(logged));
								logTime.title = infos.join(' | ');
							}
						}
					}
				});
			}
			refreshRecommandTime();
			chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
				if (request === "refreshRecommandTime") {
					refreshRecommandTime();
				}
			});

			//////////Calendar/List/Day//////////
			const COPY_REPORT_BUTTON_NAME = 'tempoCopyReportButton';
			let modal = new ModalConfirm();
			document.body.appendChild(modal.getElement());
			let toast = new Toast();
			toast.setEffect(Toast.EFFECT_EXPAND);
			document.body.appendChild(toast.getElement());
			Array.from(calendarListViewDay).forEach((el) => {//name=calendarListViewDayViewDay
				// let isToday = el.className === 'sc-bstyWg haopul tempo-mywork-calendar-today drop-zone';
				// let isToday = el.classList.contains('tempo-mywork-calendar-today');
				let strDate = el.id; // yyyy-mm-dd
				//console.log('date =', el.id, 'isToday =', (isToday?'yes':'no') );
				let logs = el.querySelectorAll('[name=tempoWorklogCard]');
				if (logs.length && !el.querySelector(`[name=${COPY_REPORT_BUTTON_NAME}]`)) {
					let tasks = [];
					Array.from(logs).forEach((el, index) => {
						// let title = el.getElementsByClassName('sc-dCzMmV sc-jAWRmi')[0].textContent;
						let key = el.getElementsByClassName('sc-eylKsO')[0].textContent;
						// console.log(key, title);
						if (key.split('-')[0] !== 'TEMPO' && tasks.indexOf(key) === -1) {
							tasks.push(key);
						}
					});
					let logContainer = el.querySelector('.sc-VuRhl');
					let btnContainer = document.createElement('div');
					btnContainer.setAttribute('name', COPY_REPORT_BUTTON_NAME);
					btnContainer.style.padding = '8px 8px 0 8px';
					btnContainer.style.width = '100%';
					let btnCopyReport = document.createElement('div');
					btnCopyReport.style.width = '100%';
					btnCopyReport.className = el.querySelector('[name=tempoAddPlanWorkButton]').className;
					let btnDual = document.createElement('div')
					btnDual.className = 'sc-GLkNx jGrAdM';// button left and right container
					let btnLeft = document.createElement('div');
					btnLeft.textContent = 'Excel';
					btnLeft.className = el.querySelector('[name=tempoCalendarLogWork]').className;
					btnLeft.addEventListener('click', (e) => {
						btnCopyReport.style.cursor = 'wait';
						helper.retrieveWorklog(tasks)
							.then(resp => resp.map(v => v.join('\t')))
							.then(result => {
								helper.copyText(result.join("\n"))
									.then(() => {
										toast.setMessage(`${result.length} Result(s) copied!`);
										toast.show();
									});
							})
							.finally(() => {
								btnCopyReport.style.cursor = 'pointer';
							});
					});
					let btnRight = document.createElement('div');
					btnRight.textContent = 'HTML';
					btnRight.className = el.querySelector('[name=tempoCalendarPlanTime]').className;
					btnRight.addEventListener('click', (e) => {
						btnCopyReport.style.cursor = 'wait';
						helper.retrieveWorklog(tasks)
							.then(resp => {
								let bodyContainer = document.createElement('div');
								let tbReport = new TableReport(resp);
								let tableReport = tbReport.getElement();
								let note = document.createElement('div');
								note.innerHTML = `Current reporter name is <b>${helper.reporterName}</b>. This name can change in settings.`
								bodyContainer.appendChild(tableReport);
								bodyContainer.appendChild(note);
								// setting up modal
								modal.setTitle(`Daily Report : ${strDate}`)
									.setBody(bodyContainer)
									.setOkButtonText('Copy Table')
									.setOkButtonOnClick(function() {
										helper.copyElement(tableReport.id);
										modal.message.textContent = 'Table has copied to clipboard';
										modal.message.style.color = 'green';
										setTimeout(function() {
											modal.message.textContent = '';
											modal.message.style.color = '';
										}, 3000);
									})
									.setCancelButtonText('Close');
								modal.show();
							}).finally(() => {
								btnCopyReport.style.cursor = 'pointer';
							});
					});
					let btnLabel = document.createElement('span');
					btnLabel.className = 'sc-eLpfTy dPHSwO';
					btnLabel.textContent = 'Copy Report';
					btnLabel.style.display = 'flex';
					btnLabel.style.alignItems = 'center';
					btnLabel.style.justifyContent = 'center';
					btnLabel.style.height = '100%';
					btnLabel.style.position = 'static';
					//Appending to view
					btnDual.appendChild(btnLeft);
					btnDual.appendChild(btnRight);
					btnCopyReport.appendChild(btnDual);
					btnCopyReport.appendChild(btnLabel);
					btnContainer.appendChild(btnCopyReport);
					logContainer.appendChild(btnContainer);
				}
			});
		}
	}
})();