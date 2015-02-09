/**
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoCloseCurve
 * 折线。
 * 使用三个或三个以上控制点直接创建折线。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoLinePlotting>
 */
SuperMap.Geometry.GeoPolyline = SuperMap.Class(
    SuperMap.Geometry.GeoLinePlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoPolyline
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function (points) {
            SuperMap.Geometry.GeoLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号折线对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return SuperMap.Geometry.GeoLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geometry = new SuperMap.Geometry.GeoPolyline();
            var controlPoints = [];
            //这里只需要赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geometry._controlPoints = controlPoints;
            return geometry;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有点
            this.components = [];

            if (controlPoints.length > 1) {
                this.components = controlPoints;
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoPolyline"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoPolyline 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoPolyline>} 返回的 GeoPolyline 对象。
 */
SuperMap.Geometry.GeoPolyline.fromJSON = function (str) {
    var geoPolyline = new SuperMap.Geometry.GeoPolyline();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geoPolyline._controlPoints = arr;
    return geoPolyline;
};