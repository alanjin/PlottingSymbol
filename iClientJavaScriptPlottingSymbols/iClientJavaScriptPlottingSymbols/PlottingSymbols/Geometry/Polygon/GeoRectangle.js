/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoRectangle
 * 矩形。
 * 使用两个控制点直接创建矩形
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoRectangle = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoRectangle
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（理论上应该是两个），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号矩形对象转换为json数据（只解析了控制点）
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
            var geoRectFlag =new SuperMap.Geometry.GeoRectangle();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoRectFlag._controlPoints = controlPoints;
            return geoRectFlag;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过两个控制点计算矩形的所有点（5个）
         */
        calculateParts: function(){
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>1)
            {
                //取第一个
                var startPoint = this._controlPoints[0];
                //取最后一个
                var endPoint = this._controlPoints[this._controlPoints.length-1];
                var point1 = startPoint.clone();
                var point2 = new SuperMap.Geometry.Point(endPoint.x,startPoint.y);
                var point3 = endPoint.clone();
                var point4 = new SuperMap.Geometry.Point(startPoint.x,endPoint.y);

                this.components.push(new SuperMap.Geometry.LinearRing([point1, point2, point3, point4]));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoRectangle"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoRectangle 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoRectangle>} 返回的 GeoRectangle 对象。
 */
SuperMap.Geometry.GeoRectangle.fromJSON = function(str){
    var geometry = new SuperMap.Geometry.GeoRectangle();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};