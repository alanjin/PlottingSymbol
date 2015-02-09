/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoGatheringPlace
 * 聚集地符号。
 * 使用两个控制点直接创建聚集地符号。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoGatheringPlace = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoGatheringPlace
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点，默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号聚集地符号对象转换为json数据（只解析了控制点）
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
            var GeoGatheringPlace =new SuperMap.Geometry.GeoGatheringPlace();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            GeoGatheringPlace._controlPoints = controlPoints;
            return GeoGatheringPlace;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算聚集地符号的所有点
         */
        calculateParts: function(){
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>1)
            {
                //取第一个点作为第一控制点
                var originP = this._controlPoints[0];
                //取最后一个作为第二控制点
                var lastP = this._controlPoints[this._controlPoints.length-1];
                var points=[];
                // 向量originP_lastP
                var vectorOL= new SuperMap.Geometry.Point(lastP.x-originP.x,lastP.y-originP.y);
                // 向量originP_lastP的模
                var dOL=Math.sqrt(vectorOL.x * vectorOL.x+vectorOL.y * vectorOL.y);

                //计算第一个插值控制点
                //向量originP_P1以originP为起点，与向量originP_lastP的夹角设为30，模为√3/12*dOL，
                var v_O_P1_lr=this.calculateVector(vectorOL,Math.PI/3,Math.sqrt(3)/12*dOL);
                //取左边的向量作为向量originP_P1
                var originP_P1=v_O_P1_lr[0];
                var p1=new SuperMap.Geometry.Point(originP_P1.x+originP.x,originP_P1.y+originP.y);

                //计算第二个插值控制点，取第一控制点和第二控制点的中点为第二个插值控制点
                var p2=new SuperMap.Geometry.Point((originP.x+lastP.x)/2,(originP.y+lastP.y)/2);

                //计算第三个插值控制点
                //向量originP_P3以lastP为起点，与向量originP_lastP的夹角设为150°，模为√3/12*dOL，
                var v_L_P3_lr=this.calculateVector(vectorOL,Math.PI*2/3,Math.sqrt(3)/12*dOL);
                //取左边的向量作为向量originP_P1
                var lastP_P3=v_L_P3_lr[0];
                var p3=new SuperMap.Geometry.Point(lastP_P3.x+lastP.x,lastP_P3.y+lastP.y);

                //计算第四个插值控制点
                //向量originP_P4以向量originP_lastP中点为起点，与向量originP_lastP的夹角设为90°，模为1/2*dOL，
                var v_O_P5_lr=this.calculateVector(vectorOL,Math.PI/2,1/2*dOL);
                //取左边的向量作为向量originP_P1
                var v_O_P5=v_O_P5_lr[1];
                var p5=new SuperMap.Geometry.Point(v_O_P5.x+p2.x,v_O_P5.y+p2.y);

                var P0=originP.clone();
                var P4=lastP.clone();
                points.push(P0,p1,p2,p3,P4,p5);

                var cardinalPoints=SuperMap.Geometry.LineString.createCloseCardinal(points);
                this.components.push(SuperMap.Geometry.LineString.createBezier3(cardinalPoints,100));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoGatheringPlace"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoGatheringPlace 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoGatheringPlace>} 返回的 GeoGatheringPlace 对象。
 */
SuperMap.Geometry.GeoGatheringPlace.fromJSON = function(str){
    var GeoGatheringPlace = new SuperMap.Geometry.GeoGatheringPlace();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    GeoGatheringPlace._controlPoints = arr;
    return GeoGatheringPlace;
};