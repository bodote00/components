COMPONENT('checkboxlistexpert', function(self, config, cls) {

	var cls2 = '.' + cls;
	var recompile = false;
	var datasource;
	var reg = /\$(index|path)/g;

	self.nocompile();

	self.configure = function(key, value, init) {

		if (init)
			return;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'required':
				self.find(cls2 + '-label').tclass(cls + '-label-required', value);
				break;
			case 'type':
				self.type = config.type;
				break;
			case 'label':
				self.find(cls2 + '-label').html(value);
				break;
			case 'datasource':
				if (value.indexOf(',') === -1)
					self.datasource(value, self.bind);
				else
					self.bind('', self.parsesource(value));
				break;
		}
	};

	self.make = function() {

		var el = self.find('script');

		if (!el.length && !config.selector)
			return;

		var html;
		if (config.selector) {
			var customselector = $(document).find(config.selector);
			html = customselector.html();
			self.html(html);
		} else {
			html = el.html();
			el.remove();
		}

		self.template = Tangular.compile(html.replace('>', ' data-index="$index" data-disabled="{{ {0} }}">'.format(config.disabledkey || 'disabled')));
		recompile = html.COMPILABLE();

		config.label && self.html('<div class="' + cls + '-label{1}">{0}</div>'.format(config.label, config.required ? (' ' + cls + '-label-required') : ''));
		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.type && (self.type = config.type);
		config.disabled && self.aclass('ui-disabled');

		self.event('click', '[data-index]', function() {
			var el = $(this);

			if (config.disabled || +el.attrd('disabled'))
				return;

			var key = config.value || 'id';
			var index = +el.attrd('index');
			var data = self.get() || [];
			var val = datasource[index] ? datasource[index][key] : null;
			var valindex = data.indexOf(val);

			if (valindex === -1) {
				self.push(val);
			} else {
				data.splice(valindex, 1);
				self.set(data);
			}

			self.change(true);
		});
	};

	self.validate = function(value) {
		return config.disabled || !config.required ? true : !!value;
	};

	self.setter = function(value) {

		var key = config.value || 'id';

		if (value && !(value instanceof Array)) {
			self.set([value]);
			return;
		}

		self.find('[data-index]').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			var selected = false;
			if (value && value.length) {
				var val = datasource[index][key];
				selected = value.indexOf(val) !== -1;
			}
			el.tclass('selected', selected);
		});
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		datasource = [];

		var disabledkey = config.disabledkey || 'disabled';

		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			item[disabledkey] = +item[disabledkey] || 0;
			datasource.push(item);
			builder.push(self.template(item).replace(reg, function(text) {
				return text.substring(0, 2) === '$i' ? i.toString() : self.path + '[' + i + ']';
			}));
		}

		self.find(cls2 + '-container').remove();
		self.append('<div class="{0}-container{1}">{2}</div>'.format(cls, config.class ? ' ' + config.class : '', builder.join('')));
		self.refresh();
		recompile && self.compile();
	};
});
