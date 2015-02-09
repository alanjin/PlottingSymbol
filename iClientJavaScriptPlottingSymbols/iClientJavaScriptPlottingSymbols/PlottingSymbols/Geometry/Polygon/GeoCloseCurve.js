/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoCloseCurve
 * 闭合曲线。
 * 使用三个或三个以上控制点直接创建闭合曲线。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoCloseCurve = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoCloseCurve
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号闭合曲线对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return SuperMap.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var GeoCloseCurve =new SuperMap.Geometry.GeoCloseCurve();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            GeoCloseCurve._controlPoints = controlPoints;
            return GeoCloseCurve;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算闭合曲线的所有点
         */
        calculateParts: function(){
            var controlPoits = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个控制点时，绘制直线
            if(controlPoits.length==2)
            {
                this.components.push(new SuperMap.Geometry.LineString(controlPoits));
            }
            //至少需要三个控制点
            if(controlPoits.length>2)
            {
                var cardinalPoints=SuperMap.Geometry.LineString.createCloseCardinal(controlPoits);
                this.components.push(SuperMap.Geometry.LineString.createBezier3(cardinalPoints,100));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoCloseCurve"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoCloseCurve 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoCloseCurve>} 返回的 GeoCloseCurve 对象。
 */
SuperMap.Geometry.GeoCloseCurve.fromJSON = function(str){
    var GeoCloseCurve = new SuperMap.Geometry.GeoCloseCurve();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    GeoCloseCurve._controlPoints = arr;
    return GeoCloseCurve;
};