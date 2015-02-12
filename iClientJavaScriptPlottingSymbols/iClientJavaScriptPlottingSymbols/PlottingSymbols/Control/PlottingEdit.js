/**
 * @requires SuperMap/Control/DragFeature.js
 * @requires SuperMap/Control/SelectFeature.js
 */

/**
 * Class: SuperMap.Control.PlottingEdit
 * 标绘扩展符号编辑控件。
 *
 * 该控件激活时，单击即可选中标绘扩展符号，被选中的符号将显示其控制点，拖拽这些控制点以编辑标绘扩展符号，拖拽符号本身平移符号。
 *
 * 通过 active 和 deactive 两个方法，实现动态的激活和注销。
 *
 * Inherits From:
 *  - <SuperMap.Control>
 */
SuperMap.Control.PlottingEdit = SuperMap.Class(SuperMap.Control, {
    /**
     * Constant: EVENT_TYPES
     * 支持的事件类型:
     *  - *beforefeaturemodified* 当图层上的要素（标绘扩展符号）开始编辑前触发该事件。
     *  - *featuremodified* 当图层上的要素（标绘扩展符号）编辑时触发该事件。
     *  - *afterfeaturemodified* 当图层上的要素（标绘扩展符号）编辑完成时，触发该事件。
     */
    EVENT_TYPES: ["beforefeaturemodified", "featuremodified", "afterfeaturemodified"],

    /**
     * APIProperty: clickout
     * {Boolean} 是否在要素区域外点击鼠标，取消选择要素。默认为true。
     */
    clickout: true,

    /**
     * APIProperty: controlPointsStyle
     * {String} 控制点style。
     *
     * controlPointsStyle的可设属性如下：
     * fillColor - {String} 十六进制填充颜色，默认为"#ee9900"。
     * fillOpacity - {Number} 填充不透明度。默认为0.4。
     * strokeColor - {String} 十六进制描边颜色。
     * strokeOpacity - {Number} 描边的不透明度(0-1),默认为0.4。
     * strokeWidth - {Number} 像素描边宽度，默认为1。
     * pointRadius - {Number} 像素点半径，默认为6
     */
    controlPointsStyle: null,

    /**
     * Property: defaultStyle
     * {Boolean} 控制点默认 style。
     */
    defaultStyle: {
        fillColor: "#ee9900",
        fillOpacity: 0.4,
        strokeColor: "#ee9900",
        strokeOpacity: 1,
        strokeWidth: 1,
        pointRadius: 6
    },

    /**
     * Property: controlPoints
     * 标绘扩展符号的控制点
     */
    controlPoints: [],

    /**
     * Property: layer
     * {<SuperMap.Layer.Vector>}
     */
    layer: null,

    /**
     * Property: feature
     * {<SuperMap.Feature.Vector>} Feature（plotting symbol）currently available for modification.
     */
    feature: null,

    /**
     * Property: selectControl
     * {<SuperMap.Control.SelectFeature>}
     */
    selectControl: null,

    /**
     * Property: dragControl
     * {<SuperMap.Control.DragFeature>}
     */
    dragControl: null,

    /**
     * Property: modified
     * {Boolean} The currently selected feature has been modified.
     */
    modified: false,

    /**
     * Constructor: SuperMap.Control.PlottingEdit
     * 创建该控件的新实例。
     *
     * Parameters:
     * layer - {<SuperMap.Layer.Vector>} 执行编辑的图层。
     * options - {Object} 设置该类开放的属性值。
     *
     * 创建 PlottingEdit 控件新实例的方法如下所示：
     * (start code)
     * //定义一个矢量图层 vectorLayer 进行符号的编辑
     * var vectorLayer = new SuperMap.Layer.Vector("vector Layer");
     * //实例化一个 plottingEdit 控件
     * var plottingEdit = new SuperMap.Control.PlottingEdit(vectorLayer);
     * //地图上添加控件
     * map.addControl(plottingEdit);
     * //激活 plottingEdit 控件
     * plottingEdit.activate();
     * (end)
     */
    initialize: function (layer, options) {
        options = options || {};
        this.layer = layer;
        this.controlPoints = [];
        SuperMap.Control.prototype.initialize.apply(this, [options]);

        var control = this;

        // configure the select control
        var selectOptions = {
            clickout: this.clickout,
            toggle: false,
            onBeforeSelect: this.beforeSelectFeature,
            onSelect: this.selectFeature,
            onUnselect: this.unselectFeature,
            scope: this
        };
        this.selectControl = new SuperMap.Control.SelectFeature(
            layer, selectOptions
        );

        // configure the drag control
        var dragOptions = {
            onStart: function (feature, pixel) {
                control.dragStart.apply(control, [feature, pixel]);
            },
            onDrag: function (feature, pixel) {
                control.dragControlPoint.apply(control, [feature, pixel]);
            },
            onComplete: function (feature) {
                control.dragComplete.apply(control, [feature]);
            },
            featureCallbacks: {
                over: function (feature) {
                    control.dragControl.overFeature.apply(
                        control.dragControl, [feature]);
                }
            }
        };
        this.dragControl = new SuperMap.Control.DragFeature(
            layer, dragOptions
        );
    },

    /**
     * APIMethod: destroy
     * 销毁该类，释放空间。
     */
    destroy: function () {
        this.controlPoints = [];
        this.layer = null;
        this.selectControl.destroy();
        this.dragControl.destroy();
        SuperMap.Control.prototype.destroy.apply(this, []);
    },

    /**
     * APIMethod: activate
     * 激活该控件。
     *
     * Returns:
     * {Boolean} 激活控件是否成功。
     */
    activate: function () {
        return (this.selectControl.activate() &&
            SuperMap.Control.prototype.activate.apply(this, arguments));
    },

    /**
     * APIMethod: deactivate
     * 取消激活控件，使其不可用。
     *
     * Returns:
     * {Boolean} 返回操作是否成功。
     */
    deactivate: function () {
        var deactivated = false;
        // the return from the controls is unimportant in this case
        if (SuperMap.Control.prototype.deactivate.apply(this, arguments)) {
            this.layer.removeFeatures(this.controlPoints, {silent: true});
            this.controlPoints = [];
            this.dragControl.deactivate();
            var feature = this.feature;
            var valid = feature && feature.geometry && feature.layer;

            if (valid) {
                this.selectControl.unselect.apply(this.selectControl,
                    [feature]);
            }
            this.selectControl.deactivate();

            deactivated = true;
        }
        return deactivated;
    },

    isPlottingGeometry: function (feature) {
        if (feature.geometry instanceof SuperMap.Geometry.GeoPlotting
            || feature.geometry instanceof SuperMap.Geometry.GeoLinePlotting
            || feature.geometry instanceof SuperMap.Geometry.GeoMultiLinePlotting
            || feature.geometry instanceof SuperMap.Geometry.GeoMultiPoint
            || feature.geometry instanceof SuperMap.Geometry.GeoPoint)
            return true;
        else {
            return false;
        }
    },
    /**
     * APIMethod: deleteSymbol
     * 删除标绘扩展符号 (选中)
     *
     * Returns:
     * {Boolean} 返回操作是否成功。
     */
    deleteSymbol: function () {
        if (this.feature && this.controlPoints && this.controlPoints.length > 0) {
            this.layer.destroyFeatures(this.feature);
            this.layer.destroyFeatures(this.controlPoints);
            this.unselectFeature(this.feature);
            return true;
        }
        else {
            return false;
        }
        ;
    },

    /**
     * APIMethod: selectFeature
     * 选择需要编辑的要素。
     *
     * Parameters:
     * feature - {<SuperMap.Feature.Vector>} 要选中的要素。
     */
    selectFeature: function (feature) {
        if (this.beforeSelectFeature(feature) !== false) {
            if (this.isPlottingGeometry(feature)) {
                this.feature = feature;
                this.modified = false;
                this.resetControlPoints();
                this.dragControl.activate();
            }
        }
    },

    /**
     * APIMethod: unselectFeature
     * 取消选择编辑的要素。
     *
     * Parameters:
     * feature - {<SuperMap.Feature.Vector>} The unselected feature.
     */
    unselectFeature: function (feature) {
        this.layer.removeFeatures(this.controlPoints, {silent: true});
        this.controlPoints = [];
        this.feature = null;
        this.dragControl.deactivate();
        this.layer.events.triggerEvent("afterfeaturemodified", {
            feature: feature,
            modified: this.modified
        });
        this.modified = false;
    },

    /**
     * Method: beforeSelectFeature
     * Called before a feature is selected.
     *
     * Parameters:
     * feature - {<SuperMap.Feature.Vector>} The feature（plotting symbol） about to be selected.
     */
    beforeSelectFeature: function (feature) {
        return this.layer.events.triggerEvent(
            "beforefeaturemodified", {feature: feature}
        );
    },

    /**
     * Method: dragStart
     * Called by the drag feature control with before a feature is dragged.
     *
     * Parameters:
     * feature - {<SuperMap.Feature.Vector>} The control point or plotting symbol about to be dragged.
     * pixel - {<SuperMap.Pixel>} Pixel location of the mouse event.
     */
    dragStart: function (feature, pixel) {
        if (feature != this.feature && (this.isPlottingGeometry(feature)) && (this.isPlottingGeometry(this.feature))) {
            if (this.feature) {
                this.selectControl.clickFeature.apply(this.selectControl,
                    [this.feature]);
            }
            this.selectControl.clickFeature.apply(
                this.selectControl, [feature]);
            this.dragControl.overFeature.apply(this.dragControl,
                [feature]);
            this.dragControl.lastPixel = pixel;
            this.dragControl.handlers.drag.started = true;
            this.dragControl.handlers.drag.start = pixel;
            this.dragControl.handlers.drag.last = pixel;
        }

        this._dragPixel = pixel;
        //鼠标手势，IE7、8中需重新设置cursor
        SuperMap.Element.removeClass(this.map.viewPortDiv, "smDragDown");
        this.map.viewPortDiv.style.cursor = "pointer";
    },

    /**
     * Method: dragControlPoint
     * Called by the drag feature control with each drag move of a control point or a plotting symbol.
     *
     * Parameters:
     * cp - {<SuperMap.Feature.Vector>} The control point being dragged.
     * pixel - {<SuperMap.Pixel>} Pixel location of the mouse event.
     */
    dragControlPoint: function (cp, pixel) {
        //拖拽控制点时编辑符号，拖拽符号本身时平移符号（平移符号的所有控制控制点）
        if (cp.geometry.CLASS_NAME == "SuperMap.Geometry.Point") {
            this.modified = true;
            //拖拽控制点过程中改变符号的Geometry
            var geo = this.feature.geometry;
            if (geo.isMultiPlotting) {
                var ids = [];
                for (var i = 0; i < geo.components.length; i++) {
                    ids.push(geo.components[i].id);
                }
                geo._controlPoints = this.getCpGeos();
                geo.calculateParts();
                for (var i = 0; i < geo.components.length; i++) {
                    geo.components[i].id = ids[i];
                }
                //绘制符号及控制点
                this.layer.drawFeature(this.feature);
                this.layer.drawFeature(cp);

            }
            else {
                geo._controlPoints = this.getCpGeos();
                geo.calculateParts();
                //绘制符号及控制点
                this.layer.drawFeature(this.feature);
                this.layer.drawFeature(cp);
            }
        }
        else if (this.isPlottingGeometry(cp)) {
            this.modified = true;

            //平移的时候不显示控制点
            this.layer.removeFeatures(this.controlPoints, {silent: true});

            //当前位置
            var lonLat = this.layer.getLonLatFromViewPortPx(pixel);
            //拖拽开始的位置
            var ll = this.layer.getLonLatFromViewPortPx(this._dragPixel);

            var cps = this.getCpGeos();
            for (var i = 0, len = cps.length; i < len; i++) {
                var cp = cps[i];
                //平移控制点（符号geometry的平移在拖拽控件中完成）
                cp.x += lonLat.lon - ll.lon;
                cp.y += lonLat.lat - ll.lat;
            }
            var geo = this.feature.geometry;
            geo._controlPoints = cps;
            if (geo.isMultiPlotting)   geo.calculateParts();
            this._dragPixel = pixel;
        }
    },

    /**
     * Method: dragComplete
     * Called by the drag feature control when the dragging is complete.
     */
    dragComplete: function () {
        delete this._dragPixel;
        this.resetControlPoints();
        this.setFeatureState();
        this.layer.events.triggerEvent("featuremodified",
            {feature: this.feature});
    },

    /**
     * Method: setFeatureState
     * Called when the feature is modified.  If the current state is not
     *     INSERT or DELETE, the state is set to UPDATE.
     */
    setFeatureState: function () {
        if (this.feature.state != SuperMap.State.INSERT &&
            this.feature.state != SuperMap.State.DELETE) {
            this.feature.state = SuperMap.State.UPDATE;
        }
    },

    /**
     * Method: resetControlPoints
     * 重设控制点
     */
    resetControlPoints: function () {
        //移除当前控制点
        if (this.controlPoints.length > 0) {
            this.layer.removeFeatures(this.controlPoints, {silent: true});
            this.controlPoints = [];
        }
        //重设控制点
        this.collectControlPoints();
    },

    /**
     * Method: collectControlPoints
     * Collect the control points from the modifiable plotting symbol's Geometry and push
     *     them on to the control's controlPoints array.
     */
    collectControlPoints: function () {
        if (!this.feature || !this.feature.geometry) return;
        this.controlPoints = [];
        var control = this;

        //重设符号 Geometry 的 控制点
        function collectGeometryControlPoints(geometry) {
            var i, controlPoi, cp;
            if (geometry instanceof SuperMap.Geometry.GeoPlotting || geometry instanceof SuperMap.Geometry.GeoLinePlotting
                || geometry instanceof SuperMap.Geometry.GeoPoint || geometry instanceof SuperMap.Geometry.GeoMultiPoint
                || geometry instanceof SuperMap.Geometry.GeoMultiLinePlotting) {
                var numCont = geometry._controlPoints.length;
                for (i = 0; i < numCont; ++i) {
                    cp = geometry._controlPoints[i];
                    if (cp.CLASS_NAME == "SuperMap.Geometry.Point") {
                        controlPoi = new SuperMap.Feature.Vector(cp);
                        controlPoi._sketch = true;
                        controlPoi.style = SuperMap.Util.copyAttributes(controlPoi.style, control.defaultStyle);
                        if (control.controlPointsStyle) {
                            controlPoi.style = SuperMap.Util.copyAttributes(controlPoi.style, control.controlPointsStyle);
                        }
                        control.controlPoints.push(controlPoi);
                    }
                }
            }
        }

        collectGeometryControlPoints.call(this, this.feature.geometry);
        this.layer.addFeatures(this.controlPoints, {silent: true});
    },


    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters:
     * map - {<SuperMap.Map>} The control's map.
     */
    setMap: function (map) {
        this.selectControl.setMap(map);
        this.dragControl.setMap(map);
        SuperMap.Control.prototype.setMap.apply(this, arguments);
    },

    /**
     * Method: getCpGeos
     * 从 this.controlPoints 中获取出 Geometry 控制点数组
     *
     */
    getCpGeos: function () {
        var cpFeas = this.controlPoints;
        var cpGeos = [];

        for (var i = 0; i < cpFeas.length; i++) {
            cpGeos.push(cpFeas[i].geometry);
        }

        return cpGeos;
    },

    /**
     * Method: cloneControlPoints
     * 克隆控制点数组
     *
     * Parameters:
     * cp - {<SuperMap.Geometry.Point>} 要进行克隆的控制点数组
     */
    cloneControlPoints: function (cp) {
        var controlPoints = [];

        for (var i = 0; i < cp.length; i++) {
            controlPoints.push(cp[i].clone());
        }

        return controlPoints;
    },

    /**
     * Method: controlPointsToJSON
     * 当前符号（this.feature）的控制点（Geometry._controlPoints）转为json数据。
     * (用于测试的方法)
     */
    controlPointsToJSON: function () {
        if (this.feature && this.feature.geometry && (this.isPlottingGeometry(this.feature))) {
            return this.feature.geometry.toJSON();
        }
    },

    CLASS_NAME: "SuperMap.Control.PlottingEdit"
})
;