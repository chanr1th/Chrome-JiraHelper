'use strict';
(() => {
	window.Helper = window.Helper || {}; // check for or create the object
	Helper = function () {
		this.modalId = 'bh-modal';
		this.tbReportId = 'tb-report';
		this.reporterName = 'Chanrith TANG';
		chrome.storage.sync.get(['reporterName'], (data) => {
			if (typeof data.reporterName === 'undefined' || !data.reporterName) {
				this.retrieveProfile();
			} else {
				this.reporterName = data.reporterName;
			}
		});
	}
	Helper.prototype.test = function(obj) {
		console.log(obj);
	}
	Helper.prototype.copyElement = function(elementId) {
		let body = document.body, range, sel;
		let element = document.getElementById(elementId);
		if (document.createRange && window.getSelection) {
			range = document.createRange();
			sel = window.getSelection();
			sel.removeAllRanges();
			try {
				range.selectNodeContents(element);
				sel.addRange(range);
			} catch (e) {
				range.selectNode(element);
				sel.addRange(range);
			}
		} else if (body.createTextRange) {
			range = body.createTextRange();
			range.moveToElementText(element);
			range.select();
		}
		document.execCommand("copy");
		sel.removeAllRanges();
	}
	Helper.prototype.copyText = function(copyText, msgSuccess) {
		navigator.clipboard.writeText(copyText).then(function() {
			if (typeof msgSuccess === 'string') {
				alert(msgSuccess);
			}
		}, function() {
			console.error('Failed! clipboard not copied.');
		});
	}
	Helper.prototype.generateModal = function(content = '', title = '', footer = '') {
		let backdrop = document.createElement('div');
		backdrop.id = this.modalId;
		backdrop.className = 'modal-backdrop';
		let modal = document.createElement('div');
		modal.className = 'modal';
		let modalHeader = document.createElement('header');
		let modalTitle = document.createElement('span');
		modalTitle.className = 'modal-title';
		modalTitle.textContent = title;
		let modalClose = document.createElement('a');
		modalClose.className = 'modal-close';
		modalClose.href = 'javascript:void(0);';
		modalClose.innerHTML = '&times;';
		modalClose.addEventListener('click', e => this.hideModal());
		modalHeader.appendChild(modalTitle);
		modalHeader.appendChild(modalClose);
		let modalBody = document.createElement('section');
		this.setElementContent(modalBody, content);
		let modalFooter = document.createElement('footer');
		this.setElementContent(modalFooter, footer);

		modal.appendChild(modalHeader);
		modal.appendChild(modalBody);
		modal.appendChild(modalFooter);
		backdrop.appendChild(modal);
		return backdrop;
	}
	Helper.prototype.showModal = function(content = '', title = 'Modal', footer = '') {
		let modal = document.getElementById('bh-modal');
		if (modal) {
			let modalTitle = modal.querySelector('.modal-title');
			modalTitle.textContent = title;
			let modalBody = modal.querySelector('section');
			this.setElementContent(modalBody, content);
			let modalFooter = modal.querySelector('footer');
			this.setElementContent(modalFooter, footer);
		} else {
			modal = this.generateModal(content, title, footer);
			document.body.appendChild(modal);
		}
		//let modalBody = document.querySelector('#bh-modal .modal section');
		modal.style.visibility = 'visible';
	}
	Helper.prototype.hideModal = function() {
		let modal = document.getElementById(this.modalId);
		if (modal) {
			modal.style.visibility = 'hidden';
		}
	}
	Helper.prototype.setElementContent = function(element, content, type = 'html') {
		if (type === 'text') {
			element.textContent = content;
		} else {
			element.innerHTML = '';
			if (content instanceof HTMLElement) {
				element.appendChild(content);
			} else {
				element.innerHTML = content;
			}
		}
	}
	Helper.prototype.parseHumanReadableTime = function(second) {
		const ONE_MINUTE = 60;// 60s = 1m
		const ONE_HOUR = 3600;// 3600s = 1h
		const ONE_DAY = 28800;// 28800s = 8h = 1d
		const ONE_WEEK = 144000;// 144000s = 5d = 1w
		let result = [];
		if (second >= ONE_WEEK) {
			result.push(parseInt(second / ONE_WEEK) + 'w');
			second = second % ONE_WEEK;
		}
		if (second >= ONE_DAY) {
			result.push(parseInt(second / ONE_DAY) + 'd');
			second = second % ONE_DAY;
		}
		if (second >= ONE_HOUR) {
			result.push(parseInt(second / ONE_HOUR) + 'h');
			second = second % ONE_HOUR;
		}
		if (second >= ONE_MINUTE) {
			result.push(parseInt(second / ONE_MINUTE) + 'm');
		}
		return result.join(' ');
	}
	Helper.prototype.parseTime = function(strTime) {
		// let durations = loggedTime[0].textContent.split(' of ')[0].split(" ");
		let durations = strTime.split(" ");
		let second = 0;
		if (durations.length > 0) {
			for (let i=0; i<durations.length ;i++) {
				let duration = durations[i].trim();
				switch (duration.charAt(duration.length-1).toLowerCase()) {
					case 'd':
						second += parseInt(duration.substring(0, duration.length-1))*8*3600;
						break;
					case 'h':
						second += parseInt(duration.substring(0, duration.length-1))*3600;
						break;
					case 'm':
						second += parseInt(duration.substring(0, duration.length-1))*60;
						break;
					case 's':
						second += parseInt(duration.substring(0, duration.length-1));
						break;
				}
			}
		}
		return second;
	}
	Helper.prototype.generateReportTable = function(data) {
		let tbReport = new TableReport(this.tbReportId, data);
		return tbReport.getElement();
	}
	Helper.prototype.generateHtmlButton = function(label, type = 'primary') {
		let btn = document.createElement('button');
		switch (type) {
			case 'secondary':
				btn.className = 'aui-button aui-button-secondary';
				break;
			case 'cancel':
				btn.className = 'aui-button aui-button-link cancel';
				break;
			default:
				btn.className = 'aui-button aui-button-primary';
		}
		btn.textContent = label;
		return btn;
	}
	Helper.prototype.retrieveWorklog = async function (tasks) {
		let result = [];
		// this.reporterName = await this.readLocalStorage('reporterName');
		for (let i = 0 ;i < tasks.length ; i++) {
			result.push(
				await fetch(`/rest/api/2/issue/${tasks[i]}`)
					.then(resp => resp.json())
					.then(resp => this._formatReponse(resp))
			);
		}
		return Promise.resolve(result);
	}
	Helper.prototype.retrieveProfile = function (tasks) {
		fetch(`/rest/api/2/myself`)
		.then(resp => resp.json())
		.then(resp => {
			if (typeof resp.displayName !== 'undefined') {
				this.reporterName = resp.displayName;console.log("who is thi", this);
				chrome.storage.sync.set({reporterName : resp.displayName});
			}
		});
	}
	Helper.prototype._formatReponse = function (data) {
		let issueType = '';
		data.fields.issuetype.name.split(' ').forEach((e) => {
			issueType += e.charAt(0).toUpperCase();
		});
		let fixVersion = 'None'
		if (typeof data.fields.fixVersions !== 'undefined' && data.fields.fixVersions.length > 0) {
			fixVersion = data.fields.fixVersions[0].name;
		}
		let estimateTime = this.parseHumanReadableTime(data.fields.progress.total) || '0';
		let done = (data.fields.progress.percent || '0') + '%'
		let remainingEstimate = (data.fields.timetracking.remainingEstimate || '0');
		let comment = '';
		if (typeof data.fields.worklog.worklogs !== 'undefined' && data.fields.worklog.worklogs.length > 0) {
			comment = data.fields.worklog.worklogs.pop().comment;//last worklog comment
		}
		return [
			fixVersion,
			data.key,
			issueType,
			data.fields.summary || '',
			data.fields.status.name || '',
			this.reporterName,
			done,
			estimateTime,
			remainingEstimate,
			comment
		];
	}
	Helper.prototype.readLocalStorage = async function(key) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get([key], function(result) {
				if (result[key]) {
					resolve(result[key]);
				} else {
					reject(`Storage : ${key} is empty!`);
				}
			});
		});
	}
	Helper.prototype.getTable = function(obj) {
		let data = [
			['1','2','3','4','5','6','7','8','9','0']
			, ['1','2','3','4','5','6','7','8','9','0']
		];
		let tbReport = new TableReport('table-report', data);
		return tbReport.getElement();
	}
	//////////Class//////////
	class TableTemplate {
		constructor(id, data) {
			this.id = id;
			this.data = data;
			this.table = document.createElement('table');
		}
		getHeader() {
			return document.createElement('thead');
		}
		getBody() {
			return document.createElement('tbody');
		}
		getFooter() {
			return document.createElement('tfoot');
		}
		getElement() {
			if (this.id) {
				this.table.id = this.id;
			}
			this.table.appendChild(this.getHeader());
			this.table.appendChild(this.getBody());
			this.table.appendChild(this.getFooter());
			return this.table;
		}
	}
	class TableReport extends TableTemplate {
		getHeader() {
			let tableHeader = document.createElement('thead');
			tableHeader.innerHTML = `
				<tr>
					<th>&nbsp;</th>
					<th colspan="6" align="center" style="color:white;">
						ROJECT DETAIL
					</th>
					<th>&nbsp;</th>
					<th>&nbsp;</th>
					<th>&nbsp;</th>
					<th>&nbsp;</th>
				</tr>
				<tr>
					<th rowspan="2">#</th>
					<th rowspan="2">VERSION</th>
					<th>JIRA</th>
					<th>TYPE</th>
					<th rowspan="2" width="30%">TITLE</th>
					<th rowspan="2">STATUS</th>
					<th rowspan="2">NAME</th>
					<th>% DONE</th>
					<th rowspan="2">ESTIMATED TIME</th>
					<th rowspan="2">REMAINING TIME</th>
					<th rowspan="2" width="20%">COMMENTS</th>
				</tr>
				<tr>
					<th>(Principal Task)</th>
					<th>D/FT</th>
					<th>(Current Status)</th>
				</tr>
			`;
			return tableHeader;
		}
		getBody() {
			let tableBody = document.createElement('tbody');
			this.data.forEach((d, i) => {
				d = d.map(v => v || '&nbsp;');
				tableBody.innerHTML += `<tr><td>${++i}<td>`+ d.join('<td>');
			});
			return tableBody;
		}
	}
})();

// let test = new Helper();
// let time = test.parseHumanReadableTime(32460);
// console.log('parsed Time', time);
// console.log(test.getTable());