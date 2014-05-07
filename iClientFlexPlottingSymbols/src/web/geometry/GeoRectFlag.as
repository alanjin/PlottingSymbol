package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.core.geometry.Geometry;

	/**
	 * 直角旗标
	 * 使用两个控制点直接创建直角旗标
	 */
	public class GeoRectFlag extends GeoPlotting
	{
		/**
		 * 构造函数
		 * @param points 需要传入的控制点（理论上应该是两个），默认为null 
		 */
		public function GeoRectFlag(points:Array = null)
		{
			super(points);
		}
		/**
		 * 重写了父类的方法
		 * 用于通过两个控制点计算直角旗标的所有点（5个）
		 */
		override protected function calculateParts():void
		{
			//清空原有的所有点
			this.parts = new Array();
			//至少需要两个控制点，其实也只需要两个
			if(this._controlPoints.length>1)
			{
				//取第一个
				var startPoint:Point2D = this._controlPoints[0] as Point2D;
				//取最后一个
				var endPoint:Point2D = this._controlPoints[this._controlPoints.length-1] as Point2D;
				var point1:Point2D = startPoint.clone();
				var point2:Point2D = new Point2D(endPoint.x,startPoint.y);
				var point3:Point2D = new Point2D(endPoint.x,(startPoint.y+endPoint.y)/2);
				var point4:Point2D = new Point2D(startPoint.x,(startPoint.y+endPoint.y)/2);
				var point5:Point2D = new Point2D(startPoint.x,endPoint.y);
				this.addPart([point1,point2,point3,point4,point5]);
			}
		}
		/**
		 * 将军标符号直角旗标对象转换为json数据（只解析了控制点）
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
			var geoRectFlag:GeoRectFlag=new GeoRectFlag();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoRectFlag.controlPoints = controlPoints;
			return geoRectFlag;			
		}
		
		/**
		 * 根据json数据转换为GeoRectFlag对象
		 * @param str json数据
		 * @return 返回的GeoRectFlag对象
		 */
		public static function fromJSON(str:String):GeoRectFlag
		{
			var geoRectFlag:GeoRectFlag = new GeoRectFlag();
			//匹配控制点的数据
			//取第二个代表获取括号内匹配的
			var s:String = str.match(/"controlPoints":(\[.*?\])/)[1];
			var arr:Array = GeoPlotting.getControlPointsFromJSON(s);
			geoRectFlag.controlPoints = arr;
			return geoRectFlag;
		}
	}
}