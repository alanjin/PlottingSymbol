package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.core.geometry.GeoLine;
	import com.supermap.web.core.geometry.Geometry;

	/**
	 * 曲线旗标
	 * 使用两个控制点直接创建曲线旗标
	 */
	public class GeoCurveFlag extends GeoPlotting
	{
		/**
		 * 构造函数
		 * @param points 需要传入的控制点（理论上应该是两个），默认为null 
		 */
		public function GeoCurveFlag(points:Array=null)
		{
			super(points);
		}
		/**
		 * 重写了父类的方法
		 * 用于通过两个控制点计算曲线旗标的所有点
		 */
		override protected function calculateParts():void
		{
			//清空原有的所有点
			this.parts = new Array();
			//至少需要两个控制点，其欧式也只需要两个
			if(this._controlPoints.length>1) 
			{
				//取第一个
				var startPoint:Point2D = this._controlPoints[0] as Point2D;
				//取最后一个
				var endPoint:Point2D = this._controlPoints[this._controlPoints.length-1] as Point2D;
				//上曲线起始点
				var point1:Point2D = startPoint;
				//上曲线第一控制点
				var point2:Point2D = new Point2D((endPoint.x-startPoint.x)/4+startPoint.x,(endPoint.y-startPoint.y)/8+startPoint.y);
				//上曲线第二个点
				var point3:Point2D = new Point2D((startPoint.x+endPoint.x)/2,startPoint.y);
				//上曲线第二控制点
				var point4:Point2D = new Point2D((endPoint.x-startPoint.x)*3/4+startPoint.x,-(endPoint.y-startPoint.y)/8+startPoint.y);
				//上曲线结束点
				var point5:Point2D = new Point2D(endPoint.x,startPoint.y);
				
				//下曲线结束点
				var point6:Point2D = new Point2D(endPoint.x,(startPoint.y+endPoint.y)/2);
				//下曲线第二控制点
				var point7:Point2D = new Point2D((endPoint.x-startPoint.x)*3/4+startPoint.x,(endPoint.y-startPoint.y)*3/8+startPoint.y);
				//下曲线第二个点
				var point8:Point2D = new Point2D((startPoint.x+endPoint.x)/2,(startPoint.y+endPoint.y)/2);
				//下曲线第一控制点
				var point9:Point2D = new Point2D((endPoint.x-startPoint.x)/4+startPoint.x,(endPoint.y-startPoint.y)*5/8+startPoint.y);
				//下曲线起始点
				var point10:Point2D = new Point2D(startPoint.x,(startPoint.y+endPoint.y)/2);
				//旗杆底部点
				var point11:Point2D = new Point2D(startPoint.x,endPoint.y);
				//计算上曲线
				var curve1:Array = GeoLine.createBezier2([point1,point2,point3,point4,point5]).parts[0];
				//计算下曲线
				var curve2:Array = GeoLine.createBezier2([point6,point7,point8,point9,point10]).parts[0];
				var parts:Array = curve1;
				//合并
				parts = parts.concat(curve2);
				parts.push(point11);
				//设置点集合
				this.addPart(parts);
			}
		}
		
		
		
		/**
		 * 将军标符号曲线旗标对象转换为json数据（只解析了控制点）
		 * @return 返回的字符串
		 */
		override public function toJSON():String
		{
			return super.toJSON();
		}
		
		/**
		 * 重写clone方法，必须深赋值
		 * @return 返回几何对象
		 */
		override public function clone():Geometry
		{
			var geoCurveFlag:GeoCurveFlag=new GeoCurveFlag();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoCurveFlag.controlPoints = controlPoints;
			return geoCurveFlag;			
		}
		
		/**
		 * 根据json数据转换为GeoCurveFlag对象
		 * @param str json数据
		 * @return 返回的GeoCurveFlag对象
		 */
		public static function fromJSON(str:String):GeoCurveFlag
		{
			var geoCurveFlag:GeoCurveFlag = new GeoCurveFlag();
			//匹配控制点的数据
			//取第二个代表获取括号内匹配的
			var s:String = str.match(/"controlPoints":(\[.*?\])/)[1];
			var arr:Array = GeoPlotting.getControlPointsFromJSON(s);
			geoCurveFlag.controlPoints = arr;
			return geoCurveFlag;
		}
	}
}