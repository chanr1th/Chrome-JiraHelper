'use strict';

/**
 * Helper Constructs
 * @constructor
 */
class Helper {
	constructor() {
		this.reporterName = 'Chanrith TANG';
		chrome.storage.sync.get(['reporterName'], (data) => {
			if (typeof data.reporterName === 'undefined' || !data.reporterName) {
				this.retrieveProfile();
			} else {
				this.reporterName = data.reporterName;
			}
		});
		this.workingTime = {
			start : 8.5 // 8:30am
			, break : { from : 12 , to : 13.5 } // breaking time between 12pm to 1:30pm
			, end : 18 // 6:00pm
		};
	}
	copyElement(elementId) {
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
	parseHumanReadableTime(second) {
		const ONE_MINUTE = 60;// 60s = 1m
		const ONE_HOUR = 3600;// 3600s = 1h
		const ONE_DAY = 28800;// 28800s = 8h = 1d
		const ONE_WEEK = 144000;// 144000s = 5d = 1w
		let result = [];
		second = Math.abs(second);
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
	parseTime(strTime) {
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
	async retrieveWorklog(tasks) {
		let result = [];
		for (let i = 0 ;i < tasks.length ; i++) {
			result.push(
				await fetch(`/rest/api/2/issue/${tasks[i]}`)
					.then(resp => resp.json())
					.then(resp => this.formatReponse(resp))
			);
		}
		return Promise.resolve(result);
	}
	async retrieveIssues(keys) {
		let result = [];
		for (let i = 0 ;i < keys.length ; i++) {
			result.push(await fetch(`/rest/api/2/issue/${keys[i]}`).then(resp => resp.json()));
		}
		return Promise.resolve(result);
	}
	async retrieveWorklog2(tasks, date) {
		return fetch(`/rest/tempo-timesheets/4/worklogs/search`, {
			method: 'POST'
			, headers: {'Content-Type': 'application/json'}
			, body: JSON.stringify({"from":"2021-08-10", "to": "2021-08-10", "worker": ["ctang"]})
		})
		.then(resp => resp.json())
		.then(resp => {
			if (Array.isArray(resp) && resp.length > 0) {
				let issue_keys = [];
				resp.forEach(worklog => {
					if (worklog.issue.projectKey !== 'TEMPO' && issue_keys.indexOf(worklog.issue.key) === -1) {
						issue_keys.push(worklog.issue.key);
					}
				});
				return this.retrieveIssues(issue_keys).then(resp => {
					let result = [];
					if (Array.isArray(resp) && resp.length > 0) {
						resp.forEach(issue => {
							result.push(this.formatReponse(issue));
						});
					}
					return result;
				});
			}
		});
	}
	retrieveProfile () {
		fetch(`/rest/api/2/myself`)
		.then(resp => resp.json())
		.then(resp => {
			if (typeof resp.displayName !== 'undefined') {
				this.reporterName = resp.displayName;
				this.username = resp.name;
				chrome.storage.sync.set({reporterName : resp.displayName});
			}
		});
	}
	formatReponse (data) {
		if (data && data.hasOwnProperty('fields')) {
			let fixVersion = 'None'
			if (typeof data.fields.fixVersions !== 'undefined' && data.fields.fixVersions.length > 0) {
				fixVersion = data.fields.fixVersions[0].name;
			}
			let issueType = '';
			data.fields.issuetype.name.split(' ').forEach((e) => {
				issueType += e.charAt(0).toUpperCase();
			});
			let status = data.fields.status.name || '';
			let estimateTime = this.parseHumanReadableTime(data.fields.progress.total) || '0';
			let done = (data.fields.progress.percent || '0') + '%'
			let remainingEstimate = (data.fields.timetracking.remainingEstimate || '0');
			let comment = '';
			if (typeof data.fields.worklog.worklogs !== 'undefined' && data.fields.worklog.worklogs.length > 0) {
				comment = data.fields.worklog.worklogs.pop().comment;//last worklog comment
			}
			console.log('comment', data.fields.worklog.worklogs);
			return [
				fixVersion,
				data.key,
				issueType,
				data.fields.summary || '',
				status.toUpperCase(),
				this.reporterName,
				done,
				estimateTime,
				remainingEstimate,
				comment
			];
		} else {
			return data;
		}
	}
	/**
	 * get recommend log time
	 * @param  {number} loggedTime Logged time in second
	 * @return {string}            Recommend log time
	 */
	getRecommendLogTime(loggedTime) {
		let now = (new Date()).getHours() + ((new Date()).getMinutes() / 60);
		let breakTime = 0;
		// now = 16;
		if (now > this.workingTime.break.from && now < this.workingTime.break.to) {// after breaking time
			breakTime = now - this.workingTime.break.from;
		} else if (now > this.workingTime.break.to) {
			breakTime = this.workingTime.break.to - this.workingTime.break.from;
		}
		let recommendTime = now - this.workingTime.start - breakTime - (loggedTime/3600);
		let sign = recommendTime >= 0 ? '+' : '-';
		let recommend = sign + this.parseHumanReadableTime(recommendTime*3600);
		// console.log('debug:recommend time: now - start - breakTime - loggedTime = recommendTime; actualRecommendTime');
		// console.log(`debug:recommend time: ${now} - 8.5 - ${breakTime} - ${loggedTime/3600} = ${recommendTime}; ${sign}${recommend}`);
		return recommend
	}
}
class Html {
	static setContent(element, content, type = 'html') {
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
	static generateButton (text, type = 'primary') {
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
		btn.textContent = text;
		return btn;
	}
}
class TableTemplate {
	/**
	 * @constructor
	 * @param {string} id   - HTML attribut id
	 * @param {array}  data - array of row data
	 */
	constructor(id, data) {
		this.id = id;
		this.data = data;
		this.table = document.createElement('table');
	}
	addHeader(table) {
		table.appendChild(document.createElement('thead'));
	}
	addBody(table) {
		table.appendChild(document.createElement('tbody'));
	}
	addFooter(table) {
		table.appendChild(document.createElement('tfoot'));
	}
	getElement() {
		if (this.id) {
			this.table.id = this.id;
		}
		this.addHeader(this.table);
		this.addBody(this.table);
		this.addFooter(this.table);
		return this.table;
	}
}
class TableReport extends TableTemplate {
	constructor(data) {
		super('ct-report', data);
	}
	addHeader(table) {
		let tableHeader = document.createElement('thead');
		tableHeader.innerHTML = `
			<tr>
				<th>&nbsp;</th>
				<th colspan="6" align="center">
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
		table.appendChild(tableHeader);
	}
	addBody(table) {
		let tableBody = document.createElement('tbody');
		this.data.forEach((d, i) => {
			d = d.map(v => v || '&nbsp;');
			tableBody.innerHTML += `<tr><td>${++i}<td>`+ d.join('<td>');
		});
		table.appendChild(tableBody);
	}
	addFooter(table) {}
}
class ModalTemplate {
	constructor(id) {
		this.id = id;
		this.backdrop = document.createElement('div');
		this.modal = document.createElement('div');
		this.header = document.createElement('header');
		this.title = document.createElement('span');
		this.close = document.createElement('a');
		this.body = document.createElement('section');
		this.footer = document.createElement('footer');
	}
	addHeader() {
		this.title.className = 'modal-title';
		this.close.className = 'modal-close';
		this.close.href = 'javascript:void(0);';
		this.close.innerHTML = '&times;';
		this.close.addEventListener('click', e => this.hide());
		this.header.appendChild(this.title);
		this.header.appendChild(this.close);
		this.modal.appendChild(this.header);
	}
	addBody() {
		this.modal.appendChild(this.body);
	}
	addFooter() {
		this.modal.appendChild(this.footer);
	}
	hide() {
		this.backdrop.classList.toggle('show', false);
	}
	show() {
		this.backdrop.classList.toggle('show', true);
	}
	setTitle(title) {
		Html.setContent(this.title, title, 'text');
		return this;
	}
	setBody(content) {
		Html.setContent(this.body, content, 'html');
		return this;
	}
	setFooter(content) {
		Html.setContent(this.footer, content, 'html');
		return this;
	}
	getElement() {
		this.backdrop.id = this.id;
		this.backdrop.className = 'modal-backdrop';
		this.modal.className = 'modal';
		this.addHeader();
		this.addBody();
		this.addFooter();
		this.backdrop.appendChild(this.modal);
		return this.backdrop;
	}
}
class ModalConfirm extends ModalTemplate {
	constructor() {
		super('ct-modal');
		this.btnOk = Html.generateButton('Ok', 'primary');
		this.btnCancel = Html.generateButton('Cancel', 'secondary');
		this.btnCancel.addEventListener('click', e => this.hide());
		this.message = document.createElement('span');
	}
	addFooter() {
		super.addFooter();
		let container = document.createElement('div');
		container.style.display = 'flex';
		this.message.style.display = 'flex';
		this.message.style.flexGrow = 1;
		this.message.style.alignItems = 'center';
		container.appendChild(this.message);
		container.appendChild(this.btnOk);
		container.appendChild(this.btnCancel);
		this.setFooter(container);
	}
	setOkButtonText(text) {
		this.btnOk.textContent = text;
		return this;
	}
	setOkButtonOnClick(callback) {
		if (typeof callback === 'function') {
			let newBtn = Html.generateButton(this.btnOk.textContent, 'primary');
			newBtn.addEventListener('click', e => callback());
			this.btnOk.replaceWith(newBtn);
		}
		return this;
	}
	setCancelButtonText(text) {
		this.btnCancel.textContent = text;
		return this;
	}
	setCancelButtonOnClick(callback) {
		if (typeof callback === 'function') {
			let newBtn = Html.generateButton(this.btnCancel.textContent, 'secondary');
			newBtn.addEventListener('click', e => callback());
			this.btnCancel.replaceWith(newBtn);
		}
		return this;
	}
}
class Toast {
	constructor(message, icon) {
		this.toast = document.createElement('div');
		this.icon = document.createElement("div");
		this.desc = document.createElement("div");
		this.setIcon(icon);
		this.setMessage(message);
	}
	static get EFFECT_EXPAND() {
		return 'effect-expand';
	}
	show() {
		if (!document.getElementById(this.toast.id)) {
			document.body.appendChild(this.toast);
		}
		this.toast.classList.toggle('show', true);
		setTimeout(() => this.toast.classList.toggle('show', false), 5000);
	}
	setEffect(effect) {
		this.toast.classList.add(effect);
		return this;
	}
	setIcon(icon = '😜') {
		this.icon.innerHTML = '';
		if (icon.startsWith('text:')) {
			this.icon.textContent = icon.substr(icon.indexOf(':') + 1);
		} else if(icon.startsWith('html:')) {
			this.icon.innerHTML = icon.substr(icon.indexOf(':') + 1);
		} else if (icon.startsWith('img:')) {
			let img = document.createElement('img');
			img.src = icon.substr(icon.indexOf(':') + 1);
			img.width = img.height = 50;
			this.icon.appendChild(img);
		} else if (icon === 'check') {
			this.icon.innerHTML = '&check;';
		} else if (icon === 'cross') {
			this.icon.innerHTML = '&cross;';
		} else {
			this.icon.textContent = icon;
		}
		return this;
	}
	setMessage(message) {
		this.desc.innerHTML = message;
		return this;
	}
	getElement() {
		this.toast.id = 'ct-toast';
		this.toast.classList.toggle('toast', true);
		this.icon.classList.toggle('toast-icon', true);
		this.desc.classList.toggle('toast-desc', true);
		this.toast.appendChild(this.icon);
		this.toast.appendChild(this.desc);
		return this.toast;
	}
}
//////////Test//////////
let helper = new Helper();
// let time = helper.parseHumanReadableTime(32460);
// console.log('parsed Time', time);
// console.log(helper.getTable());

// let data = [
// 	['1','2','3','4','5','6','7','8','9','0']
// 	, ['1','2','3','4','5','6','7','8','9','0']
// ];
// let tbReport = new TableReport('table-report', data);
// console.log(tbReport.getElement());

helper.retrieveWorklog2().then(resp => {
	console.log('===> result =', resp);
});

