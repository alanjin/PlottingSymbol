/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoMultiLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoPolylineArrow
 * 折线箭头。
 * 使用两个或两个以上控制点直接创建折线箭头。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoMultiLinePlotting>
 */
SuperMap.Geometry.GeoPolylineArrow = SuperMap.Class(
    SuperMap.Geometry.GeoMultiLinePlotting, {

        /**
         * Constructor: SuperMap.Geometry.GeoPolylineArrow
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function (points) {
            SuperMap.Geometry.GeoMultiLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号折线箭头对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return SuperMap.Geometry.GeoMultiLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geometry = new SuperMap.Geometry.GeoPolylineArrow();
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
         * 用于通过控制点计算折线箭头的所有点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有线
            this.components = [];
            //两个控制点时，绘制直线
            if (controlPoints.length > 1) {
                var  multiLines=[];
                var startP=controlPoints[controlPoints.length-2];
                var endP=controlPoints[controlPoints.length-1];
                //直线
                var straightLine=new SuperMap.Geometry.LineString(controlPoints);
               //箭头
               var arrowLines=this.calculateArrowLines(startP,endP,10);
               multiLines.push(straightLine,arrowLines[0],arrowLines[1]);
                this.components=multiLines;
            }

        },


        CLASS_NAME: "SuperMap.Geometry.GeoPolylineArrow"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoPolylineArrow 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoPolylineArrow>} 返回的 GeoPolylineArrow 对象。
 */
SuperMap.Geometry.GeoPolylineArrow.fromJSON = function (str) {
    var geoPolyline = new SuperMap.Geometry.GeoPolylineArrow();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geoPolyline._controlPoints = arr;
    return geoPolyline;
};