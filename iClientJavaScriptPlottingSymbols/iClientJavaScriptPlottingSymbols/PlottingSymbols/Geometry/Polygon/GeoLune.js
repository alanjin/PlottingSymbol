/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoLune
 * 弓形符号。
 * 使用三点绘制弓形符号.
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoLune = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * APIProperty: sides
         * {Integer} 弓形上圆弧的点密度。默认为720，即每隔1°绘制两个点。
         */
        sides: 720,
        /**
         * Constructor: SuperMap.Geometry.GeoLune
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（理论上应该是三个），默认为null
         */
        initialize: function (points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号圆对象转换为json数据（只解析控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return SuperMap.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geoCircle = new SuperMap.Geometry.GeoLune();
            var controlPoints = [];
            //这里只需要赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoCircle._controlPoints = controlPoints;
            return geoCircle;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过三点计算弓形圆弧的圆心和半径，以第一个点A、第二个点B为圆弧的端点，AB连成直线，第三个点C为圆弧上的一点。
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有点
            this.components = [];

            //两个点时绘制半圆
            if (controlPoints.length ==2) {
                var pointA=controlPoints[0];
                var pointB=controlPoints[1];
                var centerP=this.calculateMidpoint(pointA,pointB);
                var radius=this.calculateDistance(pointA,pointB)/2;
                var angleS=this.calculateAngle(pointA,centerP);
                var points=this.calculateArc(centerP,radius,angleS,angleS+Math.PI,-1);
                this.components.push(new SuperMap.Geometry.LinearRing(points));
            }
            //至少需要三个控制点
            if (this._controlPoints.length > 2) {
                var pointA = controlPoints[0];
                var pointB = controlPoints[1];
                var pointC = controlPoints[2];
                var points=[];
                //以第一个点A、第二个点B为圆弧的端点，C为圆弧上的一点
                //计算A点和B点的中点
                var midPointAB = this.calculateMidpoint(pointA, pointB);
                //计算B点和C点的中点
                var midPointBC = this.calculateMidpoint(pointB, pointC);
                //计算向量AB
                var vectorAB = new SuperMap.Geometry.Point(pointB.x - pointA.x, pointB.y - pointA.y);
                //计算向量BC
                var vectorBC = new SuperMap.Geometry.Point(pointC.x - pointB.x, pointC.y - pointB.y);
//                判断三点是否共线，若共线，返回三点（直线）
                if(Math.abs(vectorAB.x*vectorBC.y-vectorBC.x*vectorAB.y)<0.00001)
                {
                    points.push(pointA,pointC,pointB);
                    return;
                }
                //计算过AB中点且与向量AB垂直的向量（AB的中垂线向量）
                var vector_center_midPointAB = this.calculateVector(vectorAB)[1];
                //计算过BC中点且与向量BC垂直的向量（BC的中垂线向量）
                var vector_center_midPointBC = this.calculateVector(vectorBC)[1];
                //计算圆弧的圆心
                var centerPoint = this.calculateIntersection(vector_center_midPointAB, vector_center_midPointBC, midPointAB, midPointBC);
                //计算圆弧的半径
                var radius = this.calculateDistance(centerPoint, pointA);
                //分别计算三点所在的直径线与X轴的夹角
                var angleA=this.calculateAngle(pointA,centerPoint);
                var angleB=this.calculateAngle(pointB,centerPoint);
                var angleC=this.calculateAngle(pointC,centerPoint);
                var PI=Math.PI;

                /*圆弧绘制思路为：
                angleA、angleB中最小的角对应的点为起点，最大的角对应的点为终点，若angleC不同时小于或不同时大于angleA与angleB，
                则从起点开始逆时针（direction=1）绘制点，直至终点；否则，从起点开始顺时针（direction=-1）绘制点，直至终点。
                */
                var  direction= 1,startAngle=angleA,endAngle=angleB,startP,endP;
                if(angleA>angleB)
                {
                    startAngle=angleB;
                    endAngle=angleA;
                    startP=pointB;
                    endP=pointA;
                }
                else
                {
                    startP=pointA;
                    endP=pointB;
                }
                var length=endAngle-startAngle;
                if((angleC<angleB &&angleC <angleA)||(angleC>angleB &&angleC >angleA))
                {
                    direction=-1;
                    length=startAngle+(2*PI-endAngle);
                }

                 //计算圆弧上点，默认每隔1°绘制2个点
                var step=PI/this.sides/2;
                var stepDir= step*direction;
                points.push(startP);
                for(var radians =startAngle,i = 0; i <length-step;i+=step)
                {
                    radians+=stepDir;
                    radians=radians<0?(radians+2*PI):radians;
                    radians=radians> 2*PI?(radians-2*PI):radians;
                    var circlePoint = new SuperMap.Geometry.Point(Math.cos(radians) * radius + centerPoint.x, Math.sin(radians) * radius + centerPoint.y);
                    points.push(circlePoint);

                }
                points.push(endP);
                this.components.push(new SuperMap.Geometry.LinearRing(points));
            }
        },
        /**
         * Method: calculateAngle
         * 计算圆上一点所在半径的直线与X轴的夹角，结果以弧度形式表示，范围是+π到 +2π。
         */
        calculateAngle: function (pointA, centerPoint) {
            var angle=Math.atan2((pointA.y-centerPoint.y),(pointA.x-centerPoint.x));
            if(angle<0){angle+=2*Math.PI;}
            return angle;
        },

        CLASS_NAME: "SuperMap.Geometry.GeoLune"
    }
);


/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoLune 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoLune>} 返回的 GeoLune 对象。
 */
SuperMap.Geometry.GeoLune.fromJSON = function (str) {
    var geoCircle = new SuperMap.Geometry.GeoLune();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoCircle._controlPoints = arr;
    return geoCircle;
};