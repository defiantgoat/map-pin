define([
	"dojo/dom",
	"dojo/_base/connect",
	"dojo/query",
	"dojo/on",
	"dojo/dom-attr",
	"dojo/dom-class",		
	"dojo/_base/lang",
	"dojo/dom-construct",
	"esri/map",
	"esri/graphic",
	"esri/geometry/Point",
	"esri/symbols/PictureMarkerSymbol",
	"esri/SpatialReference",
	"esri/tasks/locator",
	"dojo/domReady"],
	function(dom, connect, query, on, domAttr, domClass, lang, domConstruct, Map, Graphic, Point, PictureMarkerSymbol, SpatialReference, Locator) {	
		var mapObj;	
		var self;
		return {
			startup: function(options) {
				if(!options.initBasemap){ options.initBasemap = "streets"; }					
				mapObj = new Map("map", {
					basemap: options.initBasemap,
					displayGraphicsOnPan: false,
					fadeOnZoom: true,
					force3DTransforms: true,
					navigationMode: "css-transforms",
					zoom: 4,
					slider: true,
					sliderStyle: 'large',
					sliderPosition: "top-right"
				}); 
				this.setBasemapButtons();
				this.initMapPins();
				this.drawOnCanvasTest();
				self = this;
				self.toggleBasemapButton(options.initBasemap);
			},
			setBasemapButtons: function(){
				query("[data-basemap]").forEach(function(node){
					var _bM = domAttr.get(node, "data-basemap");
					on(node, "click", function(){
							mapObj.setBasemap(_bM);
							self.toggleBasemapButton(_bM);							
						});
			  });				
			},
			initMapPins: function() {	
				if(this.isSupported()){
					document.getElementById("files").addEventListener("change", this.addPins, false);
					on(dojo.byId("clearMap"), "click", function(){ mapObj.graphics.clear(); });
					self = this;
				}				
			},
			isSupported: function(){
				if (window.File && window.FileReader && window.FileList) {
				  return true;
				} else {
				  dom.byId("map-pin-tester").innerHTML = "HTML 5 File Upload Not Supported.";
				  return false;
				}	
			},
			toggleBasemapButton: function(bm){
				query("[data-basemap]").forEach(function(node){					
					domClass.remove(node, "active");
					if( domAttr.get(node, "data-basemap") == bm ){ 
						domClass.add(node, "active"); 
					}
				});		
			},
			addPins: function(evt){
				//clean this up soon.
				console.log(evt.toString());
				if(evt.toString().indexOf("Event") > 0){
				var _pins = evt.target.files; // FileList array		
				for(var i = 0; i < _pins.length; i++){
					var pin = _pins[i];
					if (!pin.type.match('image.*')) {
						continue;
					}
					var reader = new FileReader();	
					reader.onload = (function(thisPin){						
						return function(e){ // this simply returns the following function, which would be all you needed if you didn't need info about the file such as name		
							var _li = domConstruct.create("li",{
								"data-map-pin" : thisPin.name
								}, dom.byId("pins"));	
							var _img = domConstruct.create("img",{
								"onload": function(){
											if(this.width > 50 || this.height > 50 || (this.width > 50 && this.height > 50)){
												domAttr.set(_img, "width", 50); 
												domAttr.set(_img, "height", 50);
											}
											domAttr.set(_img, "width", this.width); 
											domAttr.set(_img, "height", this.height);
										},
								"src": e.target.result
							},_li);
							var _btn = domConstruct.create("button",{
								innerHTML: "Add to Map",
								"class": "float-right"	
								},_li);
							on( _btn, "click", function(){ self.addPinToMap (_img); });
							var _btn2 = domConstruct.create("button",{
								innerHTML: "Delete",
								"class": "float-right"	
								},_li);
							on( _btn2, "click", function(){ domConstruct.destroy(_li); });
							var _br = domConstruct.create("br",{
								"class": "clearer"
								},_li);
							domClass.remove(dom.byId("clearMap"), "off");
						}
					})(pin);
					reader.readAsDataURL(pin);
				}	
				domAttr.set(dom.byId("files"), "value", null);	
				}
				else{
						var _li = domConstruct.create("li",{
									"data-map-pin" : "canvas"
								}, dom.byId("pins"));	
							var _img = domConstruct.create("img",{
								"onload": function(){
											if(this.width > 50 || this.height > 50 || (this.width > 50 && this.height > 50)){
												domAttr.set(evt, "width", 50); 
												domAttr.set(evt, "height", 50);
											}
											domAttr.set(evt, "width", this.width); 
											domAttr.set(evt, "height", this.height);
										},
								"src": evt
							},_li);
							var _btn = domConstruct.create("button",{
								innerHTML: "Add to Map",
								"class": "float-right"	
								},_li);
							on( _btn, "click", function(){ self.addPinToMap (_img); });
							var _btn2 = domConstruct.create("button",{
								innerHTML: "Delete",
								"class": "float-right"	
								},_li);
							on( _btn2, "click", function(){ domConstruct.destroy(_li); });
							var _br = domConstruct.create("br",{
								"class": "clearer"
								},_li);
							domClass.remove(dom.byId("clearMap"), "off");				}
			},
			addPinToMap: function(img){
				var _addPin = on(mapObj, "click", function(e){						
					 var point = new Point(e.mapPoint.x, e.mapPoint.y, new SpatialReference({wkid:e.mapPoint.spatialReference.wkid}));
					 var pictureMarkerSymbol = new PictureMarkerSymbol(img.src, img.width, img.height);
					 var graphic = new Graphic(point, pictureMarkerSymbol);
					 mapObj.graphics.add(graphic);		
					 _addPin.remove();					 
				});
			},
			initLocator: function(){	
				var locator = new esri.tasks.Locator(locateURL);
				on(locator, "address-to-locations-complete", function(candidates){ console.log(candidates); });
				var address = { Address: "", City: "", State: "", Zip: "" } 
				locator.outSpatialReference= map.spatialReference;
				var options = {
				  address:address,
				  outFields:["*"]
				}
				locator.addressToLocations(options);
			},
			drawOnCanvasTest: function(){
					var c = document.getElementById("canvas");
					var ctx = c.getContext("2d");
					c.width = 30;
					c.height = 38;
					color = "rgb(215,25,25)";
					this.pinTypes.simplePin(ctx,color);
					var dataURL = canvas.toDataURL();		
					this.addPins(dataURL);			
					document.getElementById('canvas-img').src = dataURL;
			},
			pinTypes: {
				simplePin : function(context,color){ 
						context.width = 30;
						context.height = 25;
						context.beginPath();
						context.moveTo(5,0);
						context.lineTo(25,0);
						context.arcTo(30,0,30,5,5);
						context.lineTo(30,20);
						context.arcTo(30,25,25,25,5);
						context.lineTo(18,25);
						context.lineTo(15,35);
						context.lineTo(12,25);
						context.lineTo(5,25);
						context.arcTo(0,25,0,20,5);
						context.lineTo(0,5);
						context.arcTo(0,0,5,0,5);
						context.closePath();
						context.fillStyle = color;
						context.fill();
						}			
				}
	}; //end main	
});//end define