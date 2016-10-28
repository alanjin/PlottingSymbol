/**
 * @requires SuperMap/Handler.js
 * @requires SuperMap/Geometry/Point.js
 */

/**
 * Class: SuperMap.Handler.Plotting
 * 绘制态势符号的事件处理器（抽象类）
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 *
* Inherits from:
 *  - <SuperMap.Handler.Plotting>
 */
SuperMap.Handler.Plotting = SuperMap.Class(SuperMap.Handler, {
    /**
     * APIProperty: controlPoints
     * 存储标绘扩展符号的控制点。
     */
    controlPoints: [],

    /**
     * APIProperty: plotting
     * 标绘扩展符号，在子类的 createFeature() 中确定其实际类型。
     */
    plotting: null,

    /**
     * APIProperty: controlPoints
     * 标绘扩展符号是否处于绘制过程中，控制符号的动态显示。
     */
    isDrawing: false,

    /**
     * APIProperty: layerOptions
     * {Object} 临时绘制图层的可选属性，可用来设置图层的样式。
     */
    layerOptions: null,

    /**
     * APIProperty: pixelTolerance
     * {Number} 绘制点像素容差。绘制点操作所允许的鼠标 down 和 up（包括普通的mousedown、mouseup和touchstart、touchend）
     * 事件之间的最大像素间隔。
     * 如果设置为有效的integer值，则当鼠标down和up之间间隔超过该值时将被忽略，不会添加点要素。默认值是 5。
     */
    pixelTolerance: 5,

    /**
     * Property: point
     * {<SuperMap.Feature.Vector>} The currently drawn point （当前鼠标位置点，即绘制点）
     */
    point: null,

    /**
     * Property: layer
     * {<SuperMap.Layer.Vector>} The temporary drawing layer
     */
    layer: null,

    /**
     * Property: multi
     * {Boolean} 在传递事件到图层leyer之前，为多个节点的几何对象创建feature要素实例。默认值是false。
     */
    multi: false,

    /**
     * Property: mouseDown
     * {Boolean} The mouse is down
     */
    mouseDown: false,

    /**
     * Property: stoppedDown
     * {Boolean} Indicate whether the last mousedown stopped the event
     * propagation.
     */
    stoppedDown: null,

    /**
     * Property: lastDown
     * {<SuperMap.Pixel>} Location of the last mouse down
     */
    lastDown: null,

    /**
     * Property: lastUp
     * {<SuperMap.Pixel>}
     */
    lastUp: null,

    /**
     * Property: persist
     * {Boolean} 保留呈现的feature要素直到destroyFeature方法被调用。默认为false。
     * 如果设置为true，那么feature会保持呈现，直到handler被设置为无效或者开启另一次绘制的时候调用destroyFeature方法来清除。
     */
    persist: false,

    /**
     * Property: stopDown
     * {Boolean} 停止鼠标mousedown事件的传播。在允许"绘制过程中平移"的时候必须设置为false。默认值为false。
     */
    stopDown: false,

    /**
     * Propery: stopUp
     * {Boolean} 停止鼠标事件的传播。在允许"拖拽过程中平移"的时候必须设置为false。默认值为false。
     */
    stopUp: false,

    /**
     * Property: touch
     * {Boolean} Indcates the support of touch events.
     */
    touch: false,

    /**
     * Property: lastTouchPx
     * {<SuperMap.Pixel>} The last pixel used to know the distance between
     * two touches (for double touch).
     */
    lastTouchPx: null,

    /**
     * Constructor: SuperMap.Handler.Plotting
     * 构造函数，创建一个新的绘制态势符号要素的事件处理器。
     *
     * Parameters:
     * control - {<SuperMap.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        if(!(options && options.layerOptions && options.layerOptions.styleMap)) {
            if(!this.style)
            this.style = SuperMap.Util.extend(SuperMap.Feature.Vector.style['default'], {});
        }

        SuperMap.Handler.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: activate
     * 激活事件处理器对象上的监听处理，如果这个事件处理器对象已经激活，则返回false.
     *
     * Returns:
     * {Boolean} 事件处理器对象监听激活成功.
     */
    activate: function() {
        if(!SuperMap.Handler.prototype.activate.apply(this, arguments)) {
            return false;
        }

        this.controlPoints = [];
        this.plotting = null;
        this.isDrawing = false;

        // create temporary vector layer for rendering Geometry sketch
        // TBD: this could be moved to initialize/destroy - setting visibility here
        var options = SuperMap.Util.extend({
            displayInLayerSwitcher: false,
            // indicate that the temp vector layer will never be out of range
            // without this, resolution properties must be specified at the
            // map-level for this temporary layer to init its resolutions
            // correctly
            calculateInRange: SuperMap.Function.True
        }, this.layerOptions);
        this.layer = new SuperMap.Layer.Vector(this.CLASS_NAME, options);
        this.map.addLayer(this.layer);
        SuperMap.Element.addClass(
            this.map.viewPortDiv, "smDefault");
        return true;
    },

    /**
     * APIMethod: deactivate
     * 关闭事件处理器对象上的监听处理，如果这个事件处理器已经是关闭状态，则返回false
     *
     * Returns:
     * {Boolean} 事件处理器对象监听已经成功关闭。
     */
    deactivate: function() {
        if(!SuperMap.Handler.prototype.deactivate.apply(this, arguments)) {
            return false;
        }

        this.controlPoints = [];
        this.plotting = null;
        this.isDrawing = false;

        this.cancel();
        // If a layer's map property is set to null, it means that that layer
        // isn't added to the map. Since we ourself added the layer to the map
        // in activate(), we can assume that if this.layer.map is null it means
        // that the layer has been destroyed (as a result of map.destroy() for
        // example.
        if (this.layer.map != null) {
            //deactivate后，移除绘制时的鼠标样式
            SuperMap.Element.removeClass(
                this.map.viewPortDiv, "smDefault");
            this.destroyFeature(true);
            this.layer.destroy(false);
        }
        this.layer = null;
        this.touch = false;
        return true;
    },

    /**
     * APIMethod: createFeature
     * 创建标绘扩展符号。
     * 子类必须实现该方法，确定符号（plotting）的实例。eg:
     *
     *  this.plotting = new SuperMap.Feature.Vector(
     *
     *       //标绘扩展符号的 Geometry 类型为 GeoCircle
     *
     *      new SuperMap.Geometry.GeoCircle()
     *
     *  );
     *
     * Parameters:
     * pixel - {<SuperMap.Pixel>} 当前鼠标在地图上的像素位置.
     */
    createFeature: function(pixel) { },

    /**
     * APIMethod: modifyFeature
     * 绘制过程中修改标绘扩展符号形状。
     * 根据已添加（up函数中添加）的部分的控制点和由当前鼠标位置作为的一个临时控制点产生和符号。
     *
     * 子类视实际情况重写此方法（示例如 DoubleArrow 中的 modifyFeature ）。
     *
     * Parameters:
     * pixel - {<SuperMap.Pixel>} 鼠标在地图上的当前像素位置
     */
    modifyFeature: function(pixel) {
        //忽略Chrome mouseup触发瞬间 mousemove 产生的相同点
        if (this.lastUp && this.lastUp.equals(pixel)) {
            return true;
        }

        //新建标绘扩展符号
        if(!this.point || !this.plotting) {
            this.createFeature(pixel);
        }

        //修改临时点的位置（鼠标位置）
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;

        if(this.isDrawing == true){
            var geometry = new SuperMap.Geometry.Point(
                lonlat.lon, lonlat.lat
            );

            var cp = this.controlPoints.concat([geometry]);
            //重新设置标绘扩展符号的控制点
            this.plotting.geometry._controlPoints = this.cloneControlPoints(cp);
            //重新计算标绘扩展符号的geometry
            this.plotting.geometry.calculateParts();
            this.plotting.geometry.calculateBounds();
        }

        this.callback("modify", [this.point.geometry, this.getSketch(), false]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },

    /**
     * Method: up
     *  操作 mouseup 和 touchend，
     * 发送最后一个 mouseup 点。
     *
     * 子类必须实现此方法。此方法添加符号的控制点 ，根基实际的符号。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) { },

    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * APIMethod: move
     * Handle mousemove and touchmove.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    move: function (evt) {
        if(!this.touch // no point displayed until up on touch devices
            && (!this.mouseDown || this.stoppedDown)) {
            this.modifyFeature(evt.xy);
        }
        return true;
    },

    /**
     * Method: click
     * Handle clicks.  Clicks are stopped from propagating to other listeners
     *     on map.events or other dom elements.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    click: function(evt) {
        SuperMap.Event.stop(evt);
        return false;
    },

    /**
     * Method: dblclick
     * Handle double-clicks.  Double-clicks are stopped from propagating to other
     *     listeners on map.events or other dom elements.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        SuperMap.Event.stop(evt);
        return false;
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 1) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: addControlPoint
     * 向 controlPoints 添加控制点
     */
    addControlPoint: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new SuperMap.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.controlPoints.push(geometry);
    },

    /**
     * Method: drawFeature
     * Render features on the temporary layer.
     */
    drawFeature: function() {
        this.layer.renderer.clear();
        this.layer.drawFeature(this.plotting, this.style);
        this.layer.drawFeature(this.point, this.style);
    },

    /**
     * Method: getSketch
     * Return the sketch feature.
     *
     * Returns:
     * {<SuperMap.Feature.Vector>}
     */
    getSketch: function() {
        return this.plotting;
    },

    /**
     * Method: destroyFeature
     * Destroy the temporary geometries
     *
     * Parameters:
     * force - {Boolean} Destroy even if persist is true.
     */
    destroyFeature: function(force) {
        if(this.layer && (force || !this.persist)) {
            this.layer.destroyFeatures();
        }
        this.point = null;
        this.plotting = null;
    },

    /**
     * Method: finalize
     * Finish the Geometry and call the "done" callback.
     *
     * Parameters:
     * cancel - {Boolean} Call cancel instead of done callback.  Default
     *          is false.
     */
    finalize: function(cancel) {
        var key = cancel ? "cancel" : "done";
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;
        this.lastTouchPx = null;
        this.callback(key, [this.geometryClone()]);
        this.destroyFeature(cancel);
    },

    /**
     * APIMethod: cancel
     * 结束绘制操作并且调用cancel回调
     */
    cancel: function() {
        this.finalize(true);
    },

    /**
     * Method: getGeometry
     * Return the sketch Geometry.
     *
     * Returns:
     * {<SuperMap.Geometry.Point>}
     */
    getGeometry: function() {
        if(this.plotting && this.plotting.geometry){
            return this.plotting.geometry;
        }
    },

    /**
     * Method: geometryClone
     * Return a clone of the Geometry.
     *
     * Returns:
     * {<SuperMap.Geometry>}
     */
    geometryClone: function() {
        var geom = this.getGeometry();
        if(geom && geom._controlPoints){
            var geo =  geom.clone();
            geo.calculateParts();
            return geo;
        }
    },

    /**
     * Method: mousedown
     * Handle mousedown.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousedown: function(evt) {
        return this.down(evt);
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },

    /**
     * Method: mousemove
     * Handle mousemove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousemove: function(evt) {
        return this.move(evt);
    },

    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        return this.move(evt);
    },

    /**
     * Method: mouseup
     * Handle mouseup.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mouseup: function(evt) {
        return this.up(evt);
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        evt.xy = this.lastTouchPx;
        return this.up(evt);
    },

    /**
     * Method: mouseout
     * Handle mouse out.  For better user experience reset mouseDown
     * and stoppedDown when the mouse leaves the map viewport.
     *
     * Parameters:
     * evt - {Event} The browser event
     */
    mouseout: function(evt) {
        if(SuperMap.Util.mouseLeft(evt, this.map.eventsDiv)) {
            this.stoppedDown = this.stopDown;
            this.mouseDown = false;
        }
    },

    /**
     * Method: passesTolerance
     * Determine whether the event is within the optional pixel tolerance.
     *
     * Returns:
     * {Boolean} The event is within the pixel tolerance (if specified).
     */
    passesTolerance: function(pixel1, pixel2, tolerance) {
        var passes = true;

        if (tolerance != null && pixel1 && pixel2) {
            var dist = pixel1.distanceTo(pixel2);
            if (dist > tolerance) {
                passes = false;
            }
        }
        return passes;
    },

    /**
     * Method: cloneControlPoints
     * 克隆控制点数组
     *
     * Parameters:
     * cp - {<SuperMap.Geometry.Point>} 要进行克隆的控制点数组
     */
    cloneControlPoints: function(cp){
        var controlPoints = [];

        for(var i = 0; i < cp.length; i++){
            controlPoints.push(cp[i].clone());
        }

        return controlPoints;
    },

    /**
     * Method: drawComplete
     * 绘制完成操作
     * 当一个标绘扩展符号完成时调用此函数
     *
     */
    drawComplete: function(){
        this.finalize();
        this.isDrawing = false;
        this.controlPoints = [];

        if(this.active == true){
            this.layer.removeAllFeatures();
        }
    },

    CLASS_NAME: "SuperMap.Handler.Plotting"
});