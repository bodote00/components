COMPONENT('imageuploader', function(self) {

	var name, input, queue;
	var tmpresponse = [];
	var tmperror = [];

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	self.upload = self.browse = function(opt) {

		tmpresponse = [];
		tmperror = [];

		// opt.files optional
		// opt.width
		// opt.height
		// opt.url
		// opt.keeporiginal
		// opt.callback
		// opt.background
		// opt.quality
		// opt.multiple

		self.opt = opt;

		if (opt.files) {
			SETTER('loading/show');
			queue = [];
			for (var i = 0; i < opt.files.length; i++)
				queue.push(opt.files[i]);
			self.wait();
		} else {
			self.find('input').prop('multiple', !!opt.multiple);
			input.click();
		}

	};

	var resizewidth = function(w, h, size) {
		return Math.ceil(w * (size / h));
	};

	var resizeheight = function(w, h, size) {
		return Math.ceil(h * (size / w));
	};

	self.resizeforce = function(image) {

		var opt = self.opt;
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.width = opt.width;
		canvas.height = opt.height;
		ctx.fillStyle = opt.background || '#FFFFFF';
		ctx.fillRect(0, 0, opt.width, opt.height);

		var w = 0;
		var h = 0;
		var x = 0;
		var y = 0;
		var is = false;
		var diff = 0;

		if (image.width > opt.width || image.height > opt.height) {
			if (image.width > image.height) {

				w = resizewidth(image.width, image.height, opt.height);
				h = opt.height;

				if (w < opt.width) {
					w = opt.width;
					h = resizeheight(image.width, image.height, opt.width);
				}

				if (w > opt.width) {
					diff = w - opt.width;
					x -= (diff / 2) >> 0;
				}

				is = true;
			} else if (image.height > image.width) {

				w = opt.width;
				h = resizeheight(image.width, image.height, opt.width);

				if (h < opt.height) {
					h = opt.height;
					w = resizewidth(image.width, image.height, opt.height);
				}

				if (h > opt.height) {
					diff = h - opt.height;
					y -= (diff / 2) >> 0;
				}

				is = true;
			}
		}

		if (!is) {
			if (image.width < opt.width && image.height < opt.height) {
				w = image.width;
				h = image.height;
				x = (opt.width / 2) - (image.width / 2);
				y = (opt.height / 2) - (image.height / 2);
			} else if (image.width >= image.height) {
				w = opt.width;
				h = image.height * (opt.width / image.width);
				y = (opt.height / 2) - (h / 2);
			} else {
				h = opt.height;
				w = (image.width * (opt.height / image.height)) >> 0;
				x = (opt.width / 2) - (w / 2);
			}
		}

		ctx.drawImage(image, x, y, w, h);
		var base64 = canvas.toDataURL('image/jpeg', (opt.quality || 90) * 0.01);
		self.uploadforce(base64);
	};

	self.make = function() {
		self.aclass('hidden');
		self.append('<input type="file" accept="image/*" multiple />');
		input = self.find('input');
		self.event('change', 'input', function() {
			SETTER('loading/show');
			var t = this;
			queue = [];
			for (var i = 0; i < t.files.length; i++)
				queue.push(t.files[i]);
			self.wait();
			t.value = '';
		});
	};

	self.wait = function() {
		if (!queue || !queue.length) {
			self.opt.callback(tmpresponse, tmperror);
			self.opt = null;
			queue = null;
			SETTER('loading/hide', 300);
		} else
			self.load(queue.shift());
	};

	self.load = function(file) {
		name = file.name.replace(/\.(ico|png|jpeg|gif|svg|webp)$/, '.jpg');
		self.getorientation(file, function(orient) {
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function() {

					if (self.opt.keeporiginal && img.width == self.opt.width && img.height == self.opt.height) {
						self.upload(reader.result);
						self.change(true);
					} else {
						self.resizeforce(img);
						self.change(true);
					}

				};
				img.crossOrigin = 'anonymous';
				if (orient < 2) {
					img.src = reader.result;
				} else {
					self.resetorientation(reader.result, orient, function(url) {
						img.src = url;
					});
				}
			};
			reader.readAsDataURL(file);
		});
	};

	self.uploadforce = function(base64) {
		if (base64) {
			var data = (new Function('base64', 'filename', 'return ' + (self.opt.schema || '{file:base64,name:filename}')))(base64, name);
			AJAX('POST ' + self.opt.url.env(true), data, function(response, err) {
				if (err) {
					tmperror.push(err + '');
					self.wait();
				} else {
					var tmp = response instanceof Array ? response[0] : response;
					if (tmp) {
						if (tmp.error)
							tmperror.push(err + '');
						else
							tmpresponse.push(tmp);
					}
					self.wait();
				}
			});
		}
	};

	// http://stackoverflow.com/a/32490603
	self.getorientation = function(file, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var view = new DataView(e.target.result);
			if (view.getUint16(0, false) != 0xFFD8)
				return callback(-2);
			var length = view.byteLength;
			var offset = 2;
			while (offset < length) {
				var marker = view.getUint16(offset, false);
				offset += 2;
				if (marker == 0xFFE1) {
					if (view.getUint32(offset += 2, false) != 0x45786966)
						return callback(-1);
					var little = view.getUint16(offset += 6, false) == 0x4949;
					offset += view.getUint32(offset + 4, little);
					var tags = view.getUint16(offset, little);
					offset += 2;
					for (var i = 0; i < tags; i++)
						if (view.getUint16(offset + (i * 12), little) == 0x0112)
							return callback(view.getUint16(offset + (i * 12) + 8, little));
				} else if ((marker & 0xFF00) != 0xFF00)
					break;
				else
					offset += view.getUint16(offset, false);
			}
			return callback(-1);
		};
		reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
	};

	self.resetorientation = function(src, srcOrientation, callback) {
		var img = new Image();
		img.onload = function() {
			var width = img.width;
			var height = img.height;
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			canvas.width = width;
			canvas.height = height;

			switch (srcOrientation) {
				case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
				case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
				case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
				case 6: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 7: ctx.transform(0, -1, -1, 0, height, width); break;
				case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
			}

			ctx.drawImage(img, 0, 0);

			if (srcOrientation === 6) {
				var canvas2 = document.createElement('canvas');
				canvas2.width = width;
				canvas2.height = height;
				var ctx2 = canvas2.getContext('2d');
				ctx2.scale(-1, 1);
				ctx2.drawImage(canvas, -width, 0);
				callback(canvas2.toDataURL());
			} else
				callback(canvas.toDataURL());
		};
		img.src = src;
	};
});