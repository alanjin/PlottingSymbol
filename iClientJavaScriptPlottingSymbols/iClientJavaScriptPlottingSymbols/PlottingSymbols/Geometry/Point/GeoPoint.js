/**
 * @requires SuperMap.Geometry.Point.js
 */

/**
 *
 * Class: SuperMap.Geometry.GeoPoint
 * 点。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.Point>
 */
SuperMap.Geometry.GeoPoint = SuperMap.Class(
    SuperMap.Geometry.Point, {
        /**
         * Property: _controlPoints
         * 定义控制点字段
         * 用于存储标绘扩展符号的所有控制点
         */
        _controlPoints: [],
        /**
         * Constructor: SuperMap.Geometry.GeoPoint
         * 构造函数
         *
         * Parameters:
         * point - {<SuperMap.Geometry.Point>} 需要传入的控制点，默认为null
         */
        initialize: function (point) {
            SuperMap.Geometry.Point.prototype.initialize.apply(this, arguments);
           if(point && point instanceof SuperMap.Geometry.Point){
               this._controlPoints.push(point);
               this.calculateParts();
           }
        },

        /**
         * APIMethod: setControlPoint
         * 设置控制点
         *
         * Parameters:
         * point - {<SuperMap.Geometry.Point>} 控制点
         */
        setControlPoint: function (point) {
            if (point && point instanceof SuperMap.Geometry.Point) {
                this._controlPoints=[point];
                this.calculateParts();
            }
        },
        /**
         * APIMethod: getControlPoint
         * 获取符号控制点
         */
        getControlPoint: function () {
            return this._controlPoints[0];
        },
        /**
         * APIMethod: toJSON
         * 将军标符号点对象转换为json数据
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            if (!this._controlPoints) {
                return null;
            }
            var cp = this._controlPoints[0];
            return "{\"controlPoints\":[" + "{\"x\":  " + cp.x + ", \"y\": " + cp.y + "}" + "]}";
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var GeoPoint = new SuperMap.Geometry.GeoPoint();
            var controlPoints = [];
            //这里必须深赋值，不然在编辑时由于引用的问题出现错误
            controlPoints.push(this._controlPoints[0].clone());
            GeoPoint._controlPoints = controlPoints;
            return GeoPoint;
        },


        /**
         * Method: calculateParts
         * 重写了父类的方法
         */
        calculateParts: function () {
            if (this._controlPoints.length > 0) {
                var point = this._controlPoints[0].clone();
                this.x = point.x;
                this.y = point.y;
            }
        },
        CLASS_NAME: "SuperMap.Geometry.Point"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoPoint 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoPoint>} 返回的 GeoPoint 对象。
 */
SuperMap.Geometry.GeoPoint.fromJSON = function (str) {
    var GeoPoint = new SuperMap.Geometry.GeoPoint();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];

    //匹配每一个Point的json格式
    var r = /{.*?}/g;
    var arr = s.match(r);
    var point = eval('(' + arr[0] + ')');
    var cps = [new SuperMap.Geometry.Point(point.x, point.y)];
    GeoPoint._controlPoints = cps;
    return GeoPoint;
};