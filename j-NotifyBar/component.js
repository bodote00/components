COMPONENT('notifybar', 'timeout:5000', function(self, config, cls) {

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();
	self.history = [];

	var cls2 = '.' + cls;
	var body, buttons, prevtype, timeout, currentindex = 0;

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<div class="{0}-controls"><button name="prev" disabled><i class="fa fa-angle-left"></i></button><button name="next" disabled><i class="fa fa-angle-right"></i></button></div><div class="{0}-body">OK</div>'.format(cls));
		self.event('click', cls2 + '-body', self.hide);
		self.event('click', 'button', function() {
			self[this.name]();
		});
		body = self.find(cls2 + '-body');
		buttons = self.find('button');
	};

	self.hide = function() {
		self.aclass('hidden');
	};

	self.next = function() {
		currentindex++;
		self.draw(config.timeout * 2);
	};

	self.prev = function() {
		currentindex--;
		self.draw(config.timeout * 2);
	};

	self.show = function() {
		currentindex = self.history.length - 1;
		if (currentindex >= 0) {
			self.draw(config.timeout);
			self.check();
		}
	};

	self.draw = function(delay) {

		prevtype && self.rclass(cls + '-' + prevtype);
		var msg = self.history[currentindex];

		if (msg.body.indexOf('fa-') === -1)
			msg.body = '<i class="fa fa-' + (msg.type === 1 ? 'check-circle' : msg.type === 2 ? 'warning' : 'info-circle') + '"></i>' + msg.body;

		body.html(msg.body);
		buttons[0].disabled = !self.history.length || currentindex === 0;
		buttons[1].disabled = !self.history.length || currentindex >= (self.history.length - 1);
		prevtype = msg.type;
		self.aclass(cls + '-' + prevtype);
		self.rclass('hidden');

		timeout && clearTimeout(timeout);
		timeout = setTimeout(self.hide, delay);
	};

	self.success = function(body) {
		currentindex = self.history.push({ type: 1, body: body }) - 1;
		self.draw(config.timeout);
		self.check();
	};

	self.warning = function(body) {
		currentindex = self.history.push({ type: 2, body: body }) - 1;
		self.draw(config.timeout);
		self.check();
	};

	self.done = function(message, callback) {
		return function(response) {
			if (response instanceof Array) {
				self.warning(response[0].error || 'Unexpected error');
			} else {
				self.success(message);
				callback && callback(response);
			}
		};
	};

	self.info = function(body) {
		currentindex = self.history.push({ type: 3, body: body }) - 1;
		self.draw(config.timeout);
		self.check();
	};

	self.check = function() {
		if (self.history.length > 20)
			self.history.unshift();
	};

});