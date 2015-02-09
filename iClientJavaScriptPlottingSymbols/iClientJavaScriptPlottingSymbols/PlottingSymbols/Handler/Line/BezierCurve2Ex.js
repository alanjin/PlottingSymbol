/**
 * @requires SuperMap/Handler/Plotting
 * @requires SuperMap/Geometry/GeoBezierCurve2
 */

/**
 * Class: SuperMap.Handler.BezierCurve2Ex
 * 在地图上绘制二次贝塞尔曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，绘制第三个点后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <SuperMap.Handler.BezierCurve2Ex> 构造函数可以创建一个新的绘制二次贝塞尔曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <SuperMap.Handler.Plotting>
 */
SuperMap.Handler.BezierCurve2Ex = SuperMap.Class(SuperMap.Handler.Plotting, {
    /**
     * Constructor: SuperMap.Handler.BezierCurve2Ex
     * 构造函数，创建一个新的绘制二次贝塞尔曲线的事件处理器。
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
        SuperMap.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<SuperMap.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new SuperMap.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new SuperMap.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new SuperMap.Feature.Vector(
            new SuperMap.Geometry.GeoBezierCurve2()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0 && len <3){
                this.isDrawing = true;
            }
           else if(len == 3){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },


    CLASS_NAME: "SuperMap.Handler.BezierCurve2Ex"
});


