/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoBezierCurveN
 * N次贝塞尔曲线。
 * 使用四个或四个以上控制点直接创建N次贝塞尔曲线。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoLinePlotting>
 */
SuperMap.Geometry.GeoBezierCurveN = SuperMap.Class(
    SuperMap.Geometry.GeoLinePlotting, {
        /**
         * APIProperty: part
         * {Number} 平滑度。取值越大，曲线越平滑。取值为大于1的整数。默认为控制点点数的十倍。
         */
        part: null,
        /**
         * Constructor: SuperMap.Geometry.GeoBezierCurveN
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（四个或四个以上），默认为null
         */
        initialize: function (points) {
            SuperMap.Geometry.GeoLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号N次贝塞尔曲线对象转换为json数据（只解析了控制点）
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
            var geometry = new SuperMap.Geometry.GeoBezierCurveN();
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
         * 用于通过控制点计算N次贝塞尔曲线的所有点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个控制点时，绘制直线
            if (controlPoints.length < 4) {
                this.components = controlPoints;
            }
            else if (controlPoints.length > 3) {

                if(!this.part)this.part=controlPoints.length *10;
                this.components = SuperMap.Geometry.LineString.calculatePointsFBZN(controlPoints,this.part);
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoBezierCurveN"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoBezierCurveN 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoBezierCurveN>} 返回的 GeoBezierCurveN 对象。
 */
SuperMap.Geometry.GeoBezierCurveN.fromJSON = function (str) {
    var geometry = new SuperMap.Geometry.GeoBezierCurveN();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};