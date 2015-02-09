/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoStraightArrow
 * 直箭头
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoStraightArrow = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Property: _ratio
         * 箭头长度与宽度的比值，箭头三角形需要占用总长度的1/_ratio
         */
        _ratio: 6,

        /**
         * Constructor: SuperMap.Geometry.GeoStraightArrow
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 初始化时传入的控制点（理论上至少两个，默认为null）
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: getRatio
         * 获取箭头长宽比值，默认为6倍
         */
        getRatio: function() {
            return this._ratio;
        },

        /**
         * APIMethod: setRatio
         * 设置箭头长宽比值，默认为6倍
         *
         * Parameters:
         * value - {Number} 箭头长宽比值
         */
        setRatio: function(value){
            if(value){
                this._ratio = value;
                this.calculateParts();
            }
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geoStraightArrow =new SuperMap.Geometry.GeoStraightArrow();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoStraightArrow._ratio = this._ratio;
            geoStraightArrow._controlPoints = controlPoints;
            return geoStraightArrow;
        },

        /**
         * APIMethod: toJSON
         * 将军标符号直箭头对象转换为json数据（解析了控制点和长宽比值）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            if(!this._controlPoints)
            {
                return null;
            }
            var result;
            var len = this._controlPoints.length;
            var arr = [];
            for(var i = 0; i<len; i++)
            {
                arr.push(this.controlPointToJSON(this._controlPoints[i]));
            }
            result = "{\"controlPoints\":["+arr.join(",")+"],\"ratio\":"+this._ratio+"}";
            return result;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算箭头的所有绘制点
         */
        calculateParts: function(){
            //判定少于两个点或者为空，则直接返回
            if(this._controlPoints == null || this._controlPoints.length<2)
            {
                return;
            }
            //判断如果为两个点，且两个点重合时也直接返回
            if(this._controlPoints.length == 2 && (this._controlPoints[0]).equals(this._controlPoints[1]))
            {
                return;
            }
            //清空原有的所有点
            this.components = [];
            //计算只有两个点时，即直的斜箭头
            if(this._controlPoints.length == 2)
            {
                this.calculateTwoPoints();
            }
            //计算有三个或三个以上的点时，即弯曲的斜箭头
            else
            {
                this.calculateMorePoints();
            }
        },

        /**
         * Method: calculateTwoPoints
         * 计算两个控制点时直箭头的所有绘制点
         * 两个控制点的直箭头绘制点只需要7个就可以构成
         */
        calculateTwoPoints: function(){
            var controlPois = this.cloneControlPoints(this._controlPoints);
            
            //取出第一和第二两个点
            var pointS = controlPois[0];
            var pointE = controlPois[1];
            //计算箭头总长度，即两个控制点的距离
            var l = Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
            //计算直箭头的宽
            var w = l/this._ratio;

            //计算三角形的底边中心点坐标
            var x_ = pointS.x + (pointE.x - pointS.x)*(this._ratio-1)/this._ratio;
            var y_ = pointS.y + (pointE.y - pointS.y)*(this._ratio-1)/this._ratio;
            //计算与基本向量夹角90度的，长度为w/2的向量数组
            var v_lr = this.calculateVector(new SuperMap.Geometry.Point(pointE.x-pointS.x,pointE.y-pointS.y),Math.PI/2,w/2);
            //获取左右向量
            var v_l = v_lr[0];
            var v_r = v_lr[1];
            //左1点
            var point1 = new SuperMap.Geometry.Point(pointS.x+v_l.x,pointS.y+v_l.y);
            //左2点
            var point2 = new SuperMap.Geometry.Point(x_+point1.x-pointS.x,y_+point1.y-pointS.y);
            //左3点
            var point3 = new SuperMap.Geometry.Point(2*point2.x-x_,2*point2.y-y_);
            //顶点
            var point4 = new SuperMap.Geometry.Point(pointE.x,pointE.y);
            //右3点
            var point7 = new SuperMap.Geometry.Point(pointS.x+v_r.x,pointS.y+v_r.y);
            //右2点
            var point6 = new SuperMap.Geometry.Point(x_+point7.x-pointS.x,y_+point7.y-pointS.y);
            //右1点
            var point5 = new SuperMap.Geometry.Point(2*point6.x-x_,2*point6.y-y_);

            this.components.push(new SuperMap.Geometry.LinearRing([point1,point2,point3,point4,point5,point6,point7]));
        },

        /**
         * Method: calculateMorePoints
         * 计算三个或三个以上的控制点时的所有绘制点
         * 由于中间的控制点之间会进行差值，产生曲线效果，所以所需绘制点会很多
         * 这里使用的思想是将所有用户控制点连接起来形成一条折线段，
         * 然后在拐角进行曲线化处理（二次贝塞尔曲线差值），就形成了效果比较好的箭头
         *
         */
        calculateMorePoints: function(){
            var controlPois = this.cloneControlPoints(this._controlPoints);
            
            //计算箭头总长度
            var l = 0;
            //计算直箭头的宽
            var w = 0;
            for(var i = 0;i<controlPois.length-1;i++)
            {
                //取出首尾两个点
                var pointS = controlPois[i];
                var pointE = controlPois[i+1];
                l += Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
            }
            w = l/this._ratio;
            //定义左右控制点集合
            var points_C_l = [];
            var points_C_r = [];
            //定义尾部左右的起始点
            var point_t_l = SuperMap.Geometry.Point();
            var point_t_r = SuperMap.Geometry.Point();
            //计算中间的所有交点
            for(var j = 0;j<controlPois.length-2;j++)
            {
                var pointU_1 = controlPois[j];//第一个用户传入的点
                var pointU_2 = controlPois[j+1];//第二个用户传入的点
                var pointU_3 = controlPois[j+2];//第三个用户传入的点

                //计算向量
                var v_U_1_2 = new SuperMap.Geometry.Point(pointU_2.x-pointU_1.x,pointU_2.y-pointU_1.y);
                var v_U_2_3 = new SuperMap.Geometry.Point(pointU_3.x-pointU_2.x,pointU_3.y-pointU_2.y);

                var v_lr_1_2 = this.calculateVector(v_U_1_2,Math.PI/2,w/2);
                var v_l_1_2 = v_lr_1_2[0];
                var v_r_1_2 = v_lr_1_2[1];
                var v_lr_2_3 = this.calculateVector(v_U_2_3,Math.PI/2,w/2);
                var v_l_2_3 = v_lr_2_3[0];
                var v_r_2_3 = v_lr_2_3[1];
                //获取左右
                var point_l_1 = new SuperMap.Geometry.Point(pointU_1.x+v_l_1_2.x,pointU_1.y+v_l_1_2.y);
                var point_r_1 = new SuperMap.Geometry.Point(pointU_1.x+v_r_1_2.x,pointU_1.y+v_r_1_2.y);
                var point_l_2 = new SuperMap.Geometry.Point(pointU_2.x+v_l_2_3.x,pointU_2.y+v_l_2_3.y);
                var point_r_2 = new SuperMap.Geometry.Point(pointU_2.x+v_r_2_3.x,pointU_2.y+v_r_2_3.y);
                //向量v_U_1_2和向量v-point_l_1和point_r_1是平行的
                //如果向量a=(x1，y1)，b=(x2，y2)，则a//b等价于x1y2－x2y1=0
                //得到(x-point_l_1.x)*v_U_1_2.y=v_U_1_2.x*(y-point_l_1.y)
                //得到(point_l_2.x-x)*v_U_2_3.y=v_U_2_3.x*(point_l_2.y-y)
                //可以求出坐边的交点(x,y)，即控制点
                var point_C_l = this.calculateIntersection(v_U_1_2,v_U_2_3,point_l_1,point_l_2);
                var point_C_r = this.calculateIntersection(v_U_1_2,v_U_2_3,point_r_1,point_r_2);
                //定义中间的控制点
                var point_C_l_c;
                var point_C_r_c;
                if(j == 0)
                {
                    //记录下箭头尾部的左右两个端点
                    point_t_l = point_l_1;
                    point_t_r = point_r_1;
                    //计算第一个曲线控制点
                    point_C_l_c = new SuperMap.Geometry.Point((point_t_l.x+point_C_l.x)/2,(point_t_l.y+point_C_l.y)/2);
                    point_C_r_c = new SuperMap.Geometry.Point((point_t_r.x+point_C_r.x)/2,(point_t_r.y+point_C_r.y)/2);
                    //添加两个拐角控制点中间的中间控制点
                    points_C_l.push(point_C_l_c);
                    points_C_r.push(point_C_r_c);
                }
                else
                {
                    //获取前一个拐角控制点
                    var point_C_l_q = points_C_l[points_C_l.length-1];
                    var point_C_r_q = points_C_r[points_C_r.length-1];
                    //计算两个拐角之间的中心控制点
                    point_C_l_c = new SuperMap.Geometry.Point((point_C_l_q.x+point_C_l.x)/2,(point_C_l_q.y+point_C_l.y)/2);
                    point_C_r_c = new SuperMap.Geometry.Point((point_C_r_q.x+point_C_r.x)/2,(point_C_r_q.y+point_C_r.y)/2);
                    //添加两个拐角控制点中间的中间控制点
                    points_C_l.push(point_C_l_c);
                    points_C_r.push(point_C_r_c);
                }
                //添加后面的拐角控制点
                points_C_l.push(point_C_l);
                points_C_r.push(point_C_r);
            }
            //计算



            //进入计算头部
            //计算一下头部的长度
            var pointU_E2 = controlPois[controlPois.length-2];//倒数第二个用户点
            var pointU_E1 = controlPois[controlPois.length-1];//最后一个用户点
            //
            var v_U_E2_E1 = new SuperMap.Geometry.Point(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
            var head_d = Math.sqrt(v_U_E2_E1.x*v_U_E2_E1.x + v_U_E2_E1.y*v_U_E2_E1.y);
            //定义头部的左右两结束点
            var point_h_l;
            var point_h_r;

            //头部左右两向量数组
            var v_lr_h = [];
            var v_l_h = SuperMap.Geometry.Point();
            var v_r_h = SuperMap.Geometry.Point();
            //定义曲线最后一个控制点，也就是头部结束点和最后一个拐角点的中点
            var point_C_l_e = SuperMap.Geometry.Point();
            var point_C_r_e = SuperMap.Geometry.Point();
            //定义三角形的左右两个点
            var point_triangle_l = SuperMap.Geometry.Point();
            var point_triangle_r = SuperMap.Geometry.Point();

            //获取当前的最后的控制点，也就是之前计算的拐角点
            var point_C_l_eq = points_C_l[points_C_l.length-1];
            var point_C_r_eq = points_C_r[points_C_r.length-1];

            //三角的高度都不够
            if(head_d <= w)
            {
                v_lr_h = this.calculateVector(v_U_E2_E1,Math.PI/2,w/2);
                v_l_h = v_lr_h[0];
                v_r_h = v_lr_h[1];
                //获取头部的左右两结束点
                point_h_l = new SuperMap.Geometry.Point(pointU_E2.x+v_l_h.x,pointU_E2.y+v_l_h.y);
                point_h_r = new SuperMap.Geometry.Point(pointU_E2.x+v_r_h.x,pointU_E2.y+v_r_h.y);


                //计算最后的控制点
                point_C_l_e = new SuperMap.Geometry.Point((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
                point_C_r_e = new SuperMap.Geometry.Point((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);

                //添加最后的控制点（中心点）
                points_C_l.push(point_C_l_e);
                points_C_r.push(point_C_r_e);


                //计算三角形的左右两点
                point_triangle_l = new SuperMap.Geometry.Point(2*point_h_l.x-pointU_E2.x,2*point_h_l.y-pointU_E2.y);
                point_triangle_r = new SuperMap.Geometry.Point(2*point_h_r.x-pointU_E2.x,2*point_h_r.y-pointU_E2.y);
            }
            //足够三角的高度
            else
            {
                //由于够了三角的高度，所以首先去掉三角的高度

                //计算向量
                var v_E2_E1 = new SuperMap.Geometry.Point(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
                //取模
                var v_E2_E1_d = Math.sqrt(v_E2_E1.x*v_E2_E1.x+v_E2_E1.y*v_E2_E1.y);
                //首先需要计算三角形的底部中心点
                var point_c = new SuperMap.Geometry.Point(pointU_E1.x-v_E2_E1.x*w/v_E2_E1_d,pointU_E1.y-v_E2_E1.y*w/v_E2_E1_d);
                //计算出在三角形上底边上头部结束点

                v_lr_h = this.calculateVector(v_U_E2_E1,Math.PI/2,w/2);
                v_l_h = v_lr_h[0];
                v_r_h = v_lr_h[1];
                //获取头部的左右两结束点
                point_h_l = new SuperMap.Geometry.Point(point_c.x+v_l_h.x,point_c.y+v_l_h.y);
                point_h_r = new SuperMap.Geometry.Point(point_c.x+v_r_h.x,point_c.y+v_r_h.y);

                //计算最后的控制点
                point_C_l_e = new SuperMap.Geometry.Point((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
                point_C_r_e = new SuperMap.Geometry.Point((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);

                //添加最后的控制点（中心点）
                points_C_l.push(point_C_l_e);
                points_C_r.push(point_C_r_e);

                //计算三角形的左右点
                point_triangle_l = new SuperMap.Geometry.Point(2*point_h_l.x-point_c.x,2*point_h_l.y-point_c.y);
                point_triangle_r = new SuperMap.Geometry.Point(2*point_h_r.x-point_c.x,2*point_h_r.y-point_c.y);
            }

            //使用控制点计算差值
            //计算贝塞尔的控制点
            var points_BC_l = SuperMap.Geometry.LineString.createBezier2(points_C_l).components;
            var points_BC_r = SuperMap.Geometry.LineString.createBezier2(points_C_r).components;
            //组合左右点集和三角形三个点
            var pointsR = [point_t_l];
            //首先连接左边的差值曲线
            pointsR = pointsR.concat(points_BC_l);
            //添加左边头部结束点
            pointsR.push(point_h_l);
            //添加三角形左边点
            pointsR.push(point_triangle_l);
            //添加三角形顶点
            pointsR.push(pointU_E1);
            //添加三角形右边点
            pointsR.push(point_triangle_r);
            //添加右边头部结束点
            pointsR.push(point_h_r);
            //合并右边的所有点（先把右边的点倒序）
            pointsR = pointsR.concat(points_BC_r.reverse());

            //添加右边尾部起始点
            pointsR.push(point_t_r);

            this.components.push(new SuperMap.Geometry.LinearRing(pointsR));
        },

        CLASS_NAME: "SuperMap.Geometry.GeoStraightArrow"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoStraightArrow 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoStraightArrow>} 返回的 GeoStraightArrow 对象。
 */
SuperMap.Geometry.GeoStraightArrow.fromJSON = function(str){
    var geoStraightArrow = new SuperMap.Geometry.GeoStraightArrow();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    //匹配长宽比例
    var r = str.match(/"ratio":([0-9]+)/)[1];
    geoStraightArrow._ratio = parseInt(r);

    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoStraightArrow._controlPoints = arr;
    return geoStraightArrow;
};
