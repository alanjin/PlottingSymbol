/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoRoundedRect
 * 圆角矩形
 * 使用两个控制点直接创建圆角矩形
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoRoundedRect = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Property: _ratio
         * 圆角矩形上圆弧的半径与矩形长度宽度中最小值的比值，默认是1/10.
         */
        _ratio: 1/10,
        /**
         * Constructor: SuperMap.Geometry.GeoRoundedRect
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
         * 将军标符号圆角矩形对象转换为json数据（只解析了控制点）
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
            var geoRectFlag =new SuperMap.Geometry.GeoRoundedRect();
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
         * 用于通过两个控制点计算圆角矩形的所有点（5个）
         */
        calculateParts: function(){
//            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>1)
            {
                //取第一个
                var startPoint = this._controlPoints[0];
                //取最后一个
                var endPoint = this._controlPoints[this._controlPoints.length-1];
                var maxX=Math.max(startPoint.x,endPoint.x);
                var minX=Math.min(startPoint.x,endPoint.x);
                var maxY=Math.max(startPoint.y,endPoint.y);
                var minY=Math.min(startPoint.y,endPoint.y);

                //圆角半径为矩形宽高中最小值的1/10
                var radius=Math.min(Math.abs(startPoint.x-endPoint.x),Math.abs(startPoint.y-endPoint.y))*this._ratio;
                //圆角的圆心点依次为矩形的左上点、右上点、右下点、左下点
                var centerPoint0=new SuperMap.Geometry.Point(minX+radius,maxY-radius);
                var centerPoint1=new SuperMap.Geometry.Point(maxX-radius,maxY-radius);
                var centerPoint2=new SuperMap.Geometry.Point(maxX-radius,minY+radius);
                var centerPoint3=new SuperMap.Geometry.Point(minX+radius,minY+radius);
                //圆角矩形的圆弧依次为矩形的左上、右上、右下、左下
                var arc0=this.calculateArc(centerPoint0,radius,Math.PI,Math.PI/2,-1,180);
                var arc1=this.calculateArc(centerPoint1,radius,Math.PI/2,0,-1,180);
                var arc2=this.calculateArc(centerPoint2,radius,2*Math.PI,Math.PI*3/2,-1,180);
                var arc3=this.calculateArc(centerPoint3,radius,Math.PI*3/2,Math.PI,-1,180);
                var points=arc0.concat(arc1,arc2,arc3);
                this.components.push(new SuperMap.Geometry.LinearRing(points));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoRoundedRect"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoRoundedRect 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoRoundedRect>} 返回的 GeoRoundedRect 对象。
 */
SuperMap.Geometry.GeoRoundedRect.fromJSON = function(str){
    var geometry = new SuperMap.Geometry.GeoRoundedRect();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};