/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoEllipse
 * 椭圆。
 * 使用椭圆上的两个点绘制出一个椭圆
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoEllipse = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {

        /**
         * APIProperty: sides
         * {Integer} 椭圆控制点点的数量，要求必须大于2。默认的值为360
         */
        sides: 360,

        /**
         * Constructor: SuperMap.Geometry.GeoEllipse
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
         * 将军标符号圆对象转换为json数据（只解析控制点）
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
            var GeoEllipse =new SuperMap.Geometry.GeoEllipse();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            GeoEllipse._controlPoints = controlPoints;
            return GeoEllipse;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过椭圆边缘的两个点计算椭圆的边缘360个点，组成一个椭圆
         */
        calculateParts: function(){
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>1)
            {
                //取第一个作为源点
                var origin = this._controlPoints[0];
                //取最后一个作为边计算点
                var radiusPoint = this._controlPoints[this._controlPoints.length-1];
                var points = [];
                //计算椭圆的半径
                var radius = Math.sqrt(2) * Math.abs(radiusPoint.y - origin.y) / 2;
                var rotatedAngle, x, y,ratio;
                var angle = Math.PI * ((1/this.sides) - (1/2));
                var dx = radiusPoint.x - origin.x;
                var dy = radiusPoint.y - origin.y;

                if(dy == 0) {
                    ratio = dx / (radius * Math.sqrt(2));
                } else {
                    ratio = dx / dy;
                }
                //计算圆的边缘所有点
                for(var i=0; i<this.sides; ++i) {
                    rotatedAngle = angle + (i * 2 * Math.PI / this.sides);
                    x = origin.x +  ratio * (radius * Math.cos(rotatedAngle))+ dx/2;
                    y = origin.y + (radius * Math.sin(rotatedAngle))+dy/2;
                    points[i]=new SuperMap.Geometry.Point(x, y);
                }
                //设置点集
                this.components.push(new SuperMap.Geometry.LinearRing(points));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoEllipse"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoEllipse 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoEllipse>} 返回的 GeoEllipse 对象。
 */
SuperMap.Geometry.GeoEllipse.fromJSON = function(str){
    var GeoEllipse = new SuperMap.Geometry.GeoEllipse();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    GeoEllipse._controlPoints = arr;
    return GeoEllipse;
};