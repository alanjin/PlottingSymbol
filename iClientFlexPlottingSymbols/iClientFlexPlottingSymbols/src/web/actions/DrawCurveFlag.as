package web.actions
{
	import com.supermap.web.core.Feature;
	import com.supermap.web.core.Point2D;
	import web.geometry.GeoCurveFlag;
	import com.supermap.web.core.styles.PredefinedFillStyle;
	import com.supermap.web.events.DrawEvent;
	import com.supermap.web.mapping.Map;
	import com.supermap.web.sm_internal;
	
	import flash.events.MouseEvent;
	import flash.geom.Point;
	import com.supermap.web.actions.DrawAction;
	
	use namespace sm_internal;
	/**
	 * 曲线旗标编辑类
	 * 用于绘制曲线旗标
	 */
	public class DrawCurveFlag extends DrawAction
	{
		/**
		 * 定义曲线旗标字段
		 * 用于记录当前正在绘制的曲线旗标
		 */
		private var _geoCurveFlag:GeoCurveFlag;
		/**
		 * 构造函数
		 *  @param map 初始化时需要关联的地图
		 */
		public function DrawCurveFlag(map:Map)
		{
			super(map);
			this.style = new PredefinedFillStyle();
		}
		/**
		 * 重写事件移除函数
		 */
		override sm_internal function removeMapListeners():void
		{
			super.removeMapListeners();
			//移除绘制结束点击事件
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseEndClick);
		}
		/**
		 * 绘制控件激活时，第一次点击地图触发的事件
		 * 
		 */
		override protected function onMouseClick(event:MouseEvent):void
		{
			//设置开始绘制
			this.actionStarted = true;
			//设置地图交点
			this.map.setFocus();
			//移除此自身事件，触发后不需要再次触发
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseClick);
			//注册绘制结束事件（也就是第二次点击地图时触发绘制结束）
			map.layerHolder.addEventListener(MouseEvent.CLICK, this.onMouseEndClick);
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//初始化绘制时在图层中需要显示的临时Feature
			this.tempFeature = new Feature();
			//开始绘制（父类的方法）
			startDraw(point2D);
			//初始化曲线旗标，多添加一个点
			this._geoCurveFlag = new GeoCurveFlag([point2D,point2D]);
			//设置风格
			this.tempFeature.style = this.style;
			//设置几何对象
			this.tempFeature.geometry = this._geoCurveFlag;
			//添加到临时图层中
			this.tempLayer.addFeature(this.tempFeature);
		}
		/**
		 *绘制技术事件，即鼠标第二次点击地图触发的事件
		 */
		private function onMouseEndClick(event:MouseEvent):void
		{
			//如果不在绘制中直接返回
			if (!this.actionStarted)
			{
				return;
			}
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//直接跟换第二个点
			this._geoCurveFlag.controlPoints[1] = point2D;
			//重新设置一下，触发旗标计算
			this._geoCurveFlag.controlPoints = this._geoCurveFlag.controlPoints;
			//设置绘制处于结束
			this.actionStarted = false;
			
			event.stopPropagation();
			//移除绘制结束事件
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseEndClick);
			//重新注册绘制开始事件
			map.layerHolder.addEventListener(MouseEvent.CLICK, this.onMouseClick);
			//结束绘制
			this.endDraw(point2D);
		}
		
		/**
		 * 绘制中途鼠标移动事件
		 * 
		 */
		override protected function onMouseMove(event:MouseEvent):void
		{
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//如果不在绘制中直接返回
			if (!this.actionStarted)
			{
				return;
			}
			//判断地图是否处于动画或平移中
			if (this.map.isTweening || this.map.isPanning)
			{
				return;
			}
			//直接跟换第二个点
			this._geoCurveFlag.controlPoints[1] = point2D;
			//重新设置一下，触发旗标计算
			this._geoCurveFlag.controlPoints = this._geoCurveFlag.controlPoints;
			//刷新feature
			this.tempFeature.refresh();
		}
	}
}