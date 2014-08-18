package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.sm_internal;
	import com.supermap.web.core.geometry.GeoLine;
	import com.supermap.web.core.geometry.Geometry;
	
	use namespace sm_internal;
	/**
	 * 直箭头
	 */
	public class GeoStraightArrow extends GeoPlotting
	{
		/**
		 * 箭头长度与宽度的比值，箭头三角形需要占用总长度的1/_ratio
		 */
		private var _ratio:Number = 6;
		/**
		 * 构造函数
		 *  @param points 初始化时传入的控制点（理论上至少两个，默认为null）
		 */
		public function GeoStraightArrow(points:Array = null)
		{
			super(points);
		}
		/**
		 * 获取箭头长宽比值，默认为6倍
		 */
		public function get ratio():Number
		{
			return _ratio;
		}
		/**
		 * 设置箭头长宽比值，默认为6倍
		 */
		public function set ratio(value:Number):void
		{
			_ratio = value;
		}
		
		/**
		 * 重写了父类的方法
		 * 用于通过控制点计算箭头的所有绘制点
		 */
		override protected function calculateParts():void
		{
			//判定少于两个点或者为空，则直接返回
			if(this._controlPoints == null || this._controlPoints.length<2)
			{
				return;
			}
			//判断如果为两个点，且两个点重合时也直接返回
			if(this._controlPoints.length == 2 && (this._controlPoints[0] as Point2D).equals(this._controlPoints[1] as Point2D))
			{
				return;
			}
			//清空原有的所有点
			this.parts = new Array();
			//计算只有两个点时，即直箭头
			if(this._controlPoints.length == 2)
			{
				this.calculateTwoPoints();
			}
			//计算有三个或三个以上的点时，即直的曲箭头
			else
			{
				this.calculateMorePoints();
			}
		}
		/**
		 * 计算两个控制点时直箭头的所有绘制点
		 * 两个控制点的直箭头绘制点只需要7个就可以构成
		 */
		private function calculateTwoPoints():void
		{
			//取出第一和第二两个点
			var pointS:Point2D = _controlPoints[0] as Point2D;
			var pointE:Point2D = _controlPoints[1] as Point2D;
			//计算箭头总长度，即两个控制点的距离
			var l:Number = Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
			//计算直箭头的宽
			var w:Number = l/this._ratio;
			
			//计算三角形的底边中心点坐标
			var x_:Number = pointS.x + (pointE.x - pointS.x)*(this._ratio-1)/this._ratio;
			var y_:Number = pointS.y + (pointE.y - pointS.y)*(this._ratio-1)/this._ratio;
			//计算与基本向量夹角90度的，长度为w/2的向量数组
			var v_lr:Array = this.calculateVector(new Point2D(pointE.x-pointS.x,pointE.y-pointS.y),Math.PI/2,w/2);
			//获取左右向量
			var v_l:Point2D = v_lr[0] as Point2D;
			var v_r:Point2D = v_lr[1] as Point2D;
			//左1点
			var point1:Point2D = new Point2D(pointS.x+v_l.x,pointS.y+v_l.y);
			//左2点
			var point2:Point2D = new Point2D(x_+point1.x-pointS.x,y_+point1.y-pointS.y);
			//左3点
			var point3:Point2D = new Point2D(2*point2.x-x_,2*point2.y-y_);
			//顶点
			var point4:Point2D = new Point2D(pointE.x,pointE.y);
			//右3点
			var point7:Point2D = new Point2D(pointS.x+v_r.x,pointS.y+v_r.y);
			//右2点
			var point6:Point2D = new Point2D(x_+point7.x-pointS.x,y_+point7.y-pointS.y);
			//右1点
			var point5:Point2D = new Point2D(2*point6.x-x_,2*point6.y-y_);
			
			this.addPart([point1,point2,point3,point4,point5,point6,point7]);
		}
		/**
		 * 计算三个或三个以上的控制点时的所有绘制点
		 * 由于中间的控制点之间会进行差值，产生曲线效果，所以所需绘制点会很多
		 * 这里使用的思想是将所有用户控制点连接起来形成一条折线段，
		 * 每一条线段向左右两边扩充两条平行线，这样就形成了一个折线形式的箭头，
		 * 然后在拐角进行曲线化处理（二次贝塞尔曲线差值），就形成了效果比较好的箭头
		 */
		private function calculateMorePoints():void
		{
			//计算箭头总长度
			var l:Number = 0;
			//计算直箭头的宽
			var w:Number = 0;
			for(var i:int = 0;i<this._controlPoints.length-1;i++)
			{
				//取出首尾两个点
				var pointS:Point2D = _controlPoints[i] as Point2D;
				var pointE:Point2D = _controlPoints[i+1] as Point2D;
				l += Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
			}
			w = l/this._ratio;
			//定义左右控制点集合
			var points_C_l:Array = [];
			var points_C_r:Array = [];
			//定义尾部左右的起始点
			var point_t_l:Point2D;
			var point_t_r:Point2D;
			//计算中间的所有交点
			for(var j:int = 0;j<this._controlPoints.length-2;j++)
			{
				var pointU_1:Point2D = this._controlPoints[j] as Point2D;//第一个用户传入的点
				var pointU_2:Point2D = this._controlPoints[j+1] as Point2D;//第二个用户传入的点
				var pointU_3:Point2D = this._controlPoints[j+2] as Point2D;//第三个用户传入的点
				
				//计算向量
				var v_U_1_2:Point2D = new Point2D(pointU_2.x-pointU_1.x,pointU_2.y-pointU_1.y);
				var v_U_2_3:Point2D = new Point2D(pointU_3.x-pointU_2.x,pointU_3.y-pointU_2.y);
				
				var v_lr_1_2:Array = this.calculateVector(v_U_1_2,Math.PI/2,w/2);
				var v_l_1_2:Point2D = v_lr_1_2[0] as Point2D;
				var v_r_1_2:Point2D = v_lr_1_2[1] as Point2D;
				var v_lr_2_3:Array = this.calculateVector(v_U_2_3,Math.PI/2,w/2);
				var v_l_2_3:Point2D = v_lr_2_3[0] as Point2D;
				var v_r_2_3:Point2D = v_lr_2_3[1] as Point2D;
				//获取左右
				var point_l_1:Point2D = new Point2D(pointU_1.x+v_l_1_2.x,pointU_1.y+v_l_1_2.y);
				var point_r_1:Point2D = new Point2D(pointU_1.x+v_r_1_2.x,pointU_1.y+v_r_1_2.y);
				var point_l_2:Point2D = new Point2D(pointU_2.x+v_l_2_3.x,pointU_2.y+v_l_2_3.y);
				var point_r_2:Point2D = new Point2D(pointU_2.x+v_r_2_3.x,pointU_2.y+v_r_2_3.y);
				//向量v_U_1_2和向量v-point_l_1和point_r_1是平行的
				//如果向量a=(x1，y1)，b=(x2，y2)，则a//b等价于x1y2－x2y1=0
				//得到(x-point_l_1.x)*v_U_1_2.y=v_U_1_2.x*(y-point_l_1.y)
				//得到(point_l_2.x-x)*v_U_2_3.y=v_U_2_3.x*(point_l_2.y-y)
				//可以求出坐边的交点(x,y)，即控制点
				var point_C_l:Point2D = this.calculateIntersection(v_U_1_2,v_U_2_3,point_l_1,point_l_2);
				var point_C_r:Point2D = this.calculateIntersection(v_U_1_2,v_U_2_3,point_r_1,point_r_2);
				//定义中间的控制点
				var point_C_l_c:Point2D;
				var point_C_r_c:Point2D;
				if(j == 0)
				{
					//记录下箭头尾部的左右两个端点
					point_t_l = point_l_1;
					point_t_r = point_r_1;
					//计算第一个曲线控制点
					point_C_l_c = new Point2D((point_t_l.x+point_C_l.x)/2,(point_t_l.y+point_C_l.y)/2);
					point_C_r_c = new Point2D((point_t_r.x+point_C_r.x)/2,(point_t_r.y+point_C_r.y)/2);
					//添加两个拐角控制点中间的中间控制点
					points_C_l.push(point_C_l_c);
					points_C_r.push(point_C_r_c);
				}
				else
				{
					//获取前一个拐角控制点
					var point_C_l_q:Point2D = points_C_l[points_C_l.length-1] as Point2D;
					var point_C_r_q:Point2D = points_C_r[points_C_r.length-1] as Point2D;
					//计算两个拐角之间的中心控制点
					point_C_l_c = new Point2D((point_C_l_q.x+point_C_l.x)/2,(point_C_l_q.y+point_C_l.y)/2);
					point_C_r_c = new Point2D((point_C_r_q.x+point_C_r.x)/2,(point_C_r_q.y+point_C_r.y)/2);
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
			var pointU_E2:Point2D = this._controlPoints[this._controlPoints.length-2] as Point2D;//倒数第二个用户点
			var pointU_E1:Point2D = this._controlPoints[this._controlPoints.length-1] as Point2D;//最后一个用户点
			//
			var v_U_E2_E1:Point2D = new Point2D(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
			var head_d:Number = Math.sqrt(v_U_E2_E1.x*v_U_E2_E1.x + v_U_E2_E1.y*v_U_E2_E1.y);
			//定义头部的左右两结束点
			var point_h_l:Point2D;
			var point_h_r:Point2D;
			
			//头部左右两向量数组
			var v_lr_h:Array;
			var v_l_h:Point2D;
			var v_r_h:Point2D;
			//定义曲线最后一个控制点，也就是头部结束点和最后一个拐角点的中点
			var point_C_l_e:Point2D;
			var point_C_r_e:Point2D;
			//定义三角形的左右两个点
			var point_triangle_l:Point2D;
			var point_triangle_r:Point2D;
			
			//获取当前的最后的控制点，也就是之前计算的拐角点
			var point_C_l_eq:Point2D = points_C_l[points_C_l.length-1] as Point2D;
			var point_C_r_eq:Point2D = points_C_r[points_C_r.length-1] as Point2D;
			
			//三角的高度都不够
			if(head_d <= w)
			{
				v_lr_h = this.calculateVector(v_U_E2_E1,Math.PI/2,w/2);
				v_l_h = v_lr_h[0] as Point2D;
				v_r_h = v_lr_h[1] as Point2D;
				//获取头部的左右两结束点
				point_h_l = new Point2D(pointU_E2.x+v_l_h.x,pointU_E2.y+v_l_h.y);
				point_h_r = new Point2D(pointU_E2.x+v_r_h.x,pointU_E2.y+v_r_h.y);
				
				
				//计算最后的控制点
				point_C_l_e = new Point2D((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
				point_C_r_e = new Point2D((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);
				
				//添加最后的控制点（中心点）
				points_C_l.push(point_C_l_e);
				points_C_r.push(point_C_r_e);
				
				
				//计算三角形的左右两点
				point_triangle_l = new Point2D(2*point_h_l.x-pointU_E2.x,2*point_h_l.y-pointU_E2.y);
				point_triangle_r = new Point2D(2*point_h_r.x-pointU_E2.x,2*point_h_r.y-pointU_E2.y);
			}
				//足够三角的高度
			else
			{
				//由于够了三角的高度，所以首先去掉三角的高度
				
				//计算向量
				var v_E2_E1:Point2D = new Point2D(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
				//取模
				var v_E2_E1_d:Number = Math.sqrt(v_E2_E1.x*v_E2_E1.x+v_E2_E1.y*v_E2_E1.y);
				//首先需要计算三角形的底部中心点
				var point_c:Point2D = new Point2D(pointU_E1.x-v_E2_E1.x*w/v_E2_E1_d,pointU_E1.y-v_E2_E1.y*w/v_E2_E1_d);
				//计算出在三角形上底边上头部结束点
				
				v_lr_h = this.calculateVector(v_U_E2_E1,Math.PI/2,w/2);
				v_l_h = v_lr_h[0] as Point2D;
				v_r_h = v_lr_h[1] as Point2D;
				//获取头部的左右两结束点
				point_h_l = new Point2D(point_c.x+v_l_h.x,point_c.y+v_l_h.y);
				point_h_r = new Point2D(point_c.x+v_r_h.x,point_c.y+v_r_h.y);
				
				//计算最后的控制点
				point_C_l_e = new Point2D((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
				point_C_r_e = new Point2D((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);
				
				//添加最后的控制点（中心点）
				points_C_l.push(point_C_l_e);
				points_C_r.push(point_C_r_e);
				
				//计算三角形的左右点
				point_triangle_l = new Point2D(2*point_h_l.x-point_c.x,2*point_h_l.y-point_c.y);
				point_triangle_r = new Point2D(2*point_h_r.x-point_c.x,2*point_h_r.y-point_c.y);
			}
			
			//使用控制点计算差值
			//计算贝塞尔的控制点
			var points_BC_l:Array = GeoLine.createBezier2(points_C_l).parts[0];
			var points_BC_r:Array = GeoLine.createBezier2(points_C_r).parts[0];
			//组合左右点集和三角形三个点
			var pointsR:Array = [point_t_l];
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
			this.addPart(pointsR);
			
		}
		
		/**
		 * 将军标符号直箭头对象转换为json数据（解析了控制点和长宽比值）
		 * @return 返回的字符串
		 */
		override public function toJSON():String
		{
			if(!this._controlPoints)
			{
				return null;
			}
			var result:String = "";
			var len:int = this._controlPoints.length;
			var arr:Array = [];
			for(var i:int = 0;i<len;i++)
			{
				var point:Point2D = this._controlPoints[i] as Point2D;
				arr.push(point.toJsonString());
			}
			result = "{\"controlPoints\":["+arr.join(",")+"],\"ratio\":"+this._ratio+"}";
			return result;
		}
		
		/**
		 * 重写clone方法，必须深赋值
		 * @return 返回几何对象
		 */
		override public function clone():Geometry
		{
			var geoStraightArrow:GeoStraightArrow=new GeoStraightArrow();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoStraightArrow.ratio = this._ratio;
			geoStraightArrow.controlPoints = controlPoints;
			return geoStraightArrow;			
		}
		
		/**
		 * 根据json数据转换为GeoStraightArrow对象
		 * @param str json数据
		 * @return 返回的GeoStraightArrow对象
		 */
		public static function fromJSON(str:String):GeoStraightArrow
		{
			var geoStraightArrow:GeoStraightArrow = new GeoStraightArrow();
			//匹配长宽比例
			var r:String = str.match(/"ratio":([0-9]+)/)[1];
			geoStraightArrow.ratio = parseInt(r);
			//匹配控制点的数据
			var s:String = str.match(/"controlPoints":(\[.*?\])/)[1];
			var arr:Array = GeoPlotting.getControlPointsFromJSON(s);
			geoStraightArrow.controlPoints = arr;
			return geoStraightArrow;
		}
	}
}