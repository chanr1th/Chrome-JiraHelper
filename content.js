'use strict';
(() => {
	let helper = new Helper();
	////////////////TEST//////////////////////
	
	//////////////////////////////////////////
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
			let calendarCanvasDayHeader = document.getElementsByName('calendarCanvasDayHeader');
			Array.from(calendarCanvasDayHeader).forEach((el) => {
				let loggedDate = el.querySelector('.sc-jGDUUe');//ex: Sun dd.mm
				let loggedTime = el.querySelector('.sc-hPZeXZ');//ex: 7h 38m of 7h 30m
				if (loggedDate && loggedTime) {
					let second = helper.parseTime(loggedTime.textContent.split(' of ')[0]);
					let isWeekday = ['Sat', 'Sun'].indexOf(loggedDate.title.split(' ')[0]) === -1;
					const MIN_TIME = 27000;// 27000s = 450m = 7h 30m
					if (second < MIN_TIME && isWeekday) {
						loggedTime.style.color = 'red';
						let remainingLogTime = helper.parseHumanReadableTime(MIN_TIME - second);
						loggedTime.title += ` | at least ${remainingLogTime} more`;
					}
				}
			});
			const COPY_REPORT_BUTTON_NAME = 'tempoCopyReportButton';
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
						helper.retrieveData(tasks)
							.then(resp => resp.map(v => v.join('\t')))
							.then(result => helper.copyText(result.join("\n"), `${result.length} Result copied!`));
					});
					let btnRight = document.createElement('div');
					btnRight.textContent = 'HTML';
					btnRight.className = el.querySelector('[name=tempoCalendarPlanTime]').className;
					btnRight.addEventListener('click', (e) => {
						document.body.style.cursor = 'wait';
						helper.retrieveData(tasks)
							.then(resp => {
								let tableReport = helper.generateReportTable(resp);
								let footerContainer = document.createElement('div');
								footerContainer.style.display = 'flex';
								let message = document.createElement('span');
								message.style.display = 'flex';
								message.style.flexGrow = 1;
								message.style.alignItems = 'center';
								let btnCopyTable = helper.generateHtmlButton('Copy Table');
								btnCopyTable.addEventListener('click', e => {
									helper.copyElement(helper.tbReportId);
									message.textContent = 'Table has copied to clipboard';
									message.style.color = 'green';
									setTimeout(function() {
										message.textContent = '';
										message.style.color = '';
									}, 3000);
								});
								let btnCloseModal = helper.generateHtmlButton('Close', 'secondary');
								btnCloseModal.addEventListener('click', e => helper.hideModal());
								footerContainer.appendChild(message);
								footerContainer.appendChild(btnCopyTable);
								footerContainer.appendChild(btnCloseModal);
								helper.showModal(tableReport, `Daily Report : ${strDate}`, footerContainer);
							}).finally(() => {
								document.body.style.cursor = '';
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