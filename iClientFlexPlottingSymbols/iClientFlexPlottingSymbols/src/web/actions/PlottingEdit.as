package web.actions
{
	import com.supermap.web.core.Feature;
	import com.supermap.web.core.Point2D;
	import com.supermap.web.core.geometry.GeoLine;
	import com.supermap.web.core.geometry.GeoPoint;
	import web.geometry.GeoPlotting;
	import web.geometry.GeoRectFlag;
	import com.supermap.web.core.geometry.GeoRegion;
	import com.supermap.web.core.geometry.Geometry;
	import com.supermap.web.core.styles.PredefinedLineStyle;
	import com.supermap.web.core.styles.PredefinedMarkerStyle;
	import com.supermap.web.events.EditEvent;
	import com.supermap.web.events.FeatureLayerEvent;
	import com.supermap.web.mapping.FeaturesLayer;
	import com.supermap.web.mapping.Map;
	import com.supermap.web.sm_internal;
	import com.supermap.web.themes.RawTheme;
	
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.geom.Point;
	
	import mx.collections.ArrayCollection;
	
	import spark.components.mediaClasses.VolumeBar;
	import com.supermap.web.actions.DrawAction;
	
	use namespace sm_internal;
	/**
	 * 符号编辑类，可以编辑标绘扩展符号几何对象以及普通几何对象         
	 */
	public class PlottingEdit extends DrawAction
	{
		private var _isEndEditting:Boolean = false;
		
		private var _editLayer:FeaturesLayer;
		
		private var _features:ArrayCollection;
		
		private var _edittingFeature:Feature;
		
		private var _catchedLine:Feature;
		
		//保持用于编辑时添加的新的features，删除平移时使用
		private var _addedVertexFeatures:Array;
		private var _addedLineSegmentFeatures:Array;
		
		private var _snapPoint:Feature;
		
		private var _draggedVertex:Feature;
		
		private var _lastFeaturePosition:Point2D; // 记录编辑feature的平移前的位置
		
		private var _edittingFeatureParts:Array;
		
		private var _edittingFeaturePartCount:int = 0;
		
		private var _isRemoveFeature:Boolean; //更新，删除要素时用来标识是否需要删除编辑辅助产生的feature
		
		private var _edittingPointFeature:Feature;
		
		private var _hoverLineStyle:PredefinedLineStyle = new PredefinedLineStyle(PredefinedLineStyle.SYMBOL_SOLID, 0x0046d2, 1, 2);
		
		private var _vertexStyle:PredefinedMarkerStyle = new PredefinedMarkerStyle(PredefinedMarkerStyle.SYMBOL_SQUARE , 12, 0xc2c2c2, 1, 0, 0, 0, new PredefinedLineStyle());
		
		private var _snapStyle:PredefinedMarkerStyle = new PredefinedMarkerStyle(PredefinedMarkerStyle.SYMBOL_SQUARE, 12, 0xc2c2c2, 1, 0, 0, 0, new PredefinedLineStyle());
		
		//用于redo和undo浏览历史数据的参数
		private var viewGeometrySet:Array = [];
		private var viewGeometryIndex:int = 0;
		private var viewFeature:Feature;
		//用于存储键盘所支持的快捷键的可用性，默认都是true
		private var _keyboards:Array = [];
		
		/**
		 * ${actions_Edit_field_KEY_ESC_D} 
		 */	
		public static const KEY_ESC:Number = 27;
		/**
		 * ${actions_Edit_field_KEY_Z_D} 
		 */
		public static const KEY_Z:Number = 90;
		/**
		 * ${actions_Edit_field_KEY_Y_D} 
		 */
		public static const KEY_Y:Number = 89;
		public function PlottingEdit(map:Map, featureLayer:FeaturesLayer)
		{
			super(map);
			this._editLayer = featureLayer;
			this._features = featureLayer.features as ArrayCollection;
			
			if(Map.theme)
			{
				if(Map.theme.hlLineColor != 0x0046d2)
					this._hoverLineStyle.color = Map.theme.hlLineColor;
				if(Map.theme.hlPointColor != 0xc2c2c2)
				{
					this._vertexStyle.color = Map.theme.hlPointColor;
					this._snapStyle.color = Map.theme.hlPointColor;
				}
				if(Map.theme.alpha != 1)
				{
					this._vertexStyle.alpha = Map.theme.alpha;
					this._snapStyle.alpha = Map.theme.alpha;
				}
				if(Map.theme.size != 12)
				{
					this._vertexStyle.size = Map.theme.size;
					this._snapStyle.size = Map.theme.size;
				}
				if(Map.theme.weight != 2)
				{
					this._hoverLineStyle.weight = Map.theme.weight;
				}
			}
			//初始化可用的键盘快捷键
			this._keyboards[27] = true;
			this._keyboards[90] = true;
			this._keyboards[89] = true;
		}
		/**
		 * ${actions_Edit_attribute_snapStyle_D} 
		 * @return 
		 * 
		 */		
		public function get snapStyle():PredefinedMarkerStyle
		{
			return _snapStyle;
		}
		
		public function set snapStyle(value:PredefinedMarkerStyle):void
		{
			_snapStyle = value;
		}
		
		/**
		 * ${actions_Edit_attribute_vertexStyle_D}  
		 */
		public function get vertexStyle():PredefinedMarkerStyle
		{
			return _vertexStyle;
		}
		
		public function set vertexStyle(value:PredefinedMarkerStyle):void
		{
			_vertexStyle = value;
		}
		
		/**
		 * ${actions_Edit_attribute_hoverLineStyle_D}  
		 */
		public function get hoverLineStyle():PredefinedLineStyle
		{
			return _hoverLineStyle;
		}
		
		public function set hoverLineStyle(value:PredefinedLineStyle):void
		{
			_hoverLineStyle = value;
		}
		
		override sm_internal function addMapListeners():void
		{
			super.addMapListeners();
			for each(var feature:Feature in this._features)
			{
				feature.addEventListener(MouseEvent.CLICK, onFeatureClick);
			}
			this._editLayer.addEventListener(FeatureLayerEvent.FEATURE_REMOVE_ALL, removeAllFeaturesHandler);
			this._editLayer.addEventListener(FeatureLayerEvent.FEATURE_REMOVE, removeFeatureHandler);
			//			this._editLayer.addEventListener(FeatureLayerEvent.FEATURE_ADD, addFeatureHandler);
		}
		
		override sm_internal function removeMapListeners():void
		{
			for each(var feature:Feature in this._features)
			{
				feature.removeEventListener(MouseEvent.CLICK, onFeatureClick);
			}
			this._editLayer.removeEventListener(FeatureLayerEvent.FEATURE_REMOVE_ALL, removeAllFeaturesHandler);
			this._editLayer.removeEventListener(FeatureLayerEvent.FEATURE_REMOVE, removeFeatureHandler);
			if(!this._isEndEditting)
				this.onEndEdit(null);
			
		}
		/**
		 * ${actions_Edit_method_setKeyboardEnabled_D} 
		 * @param key ${actions_Edit_method_setKeyboardEnabled_param_key}
		 * @param isEnable ${actions_Edit_method_setKeyboardEnabled_param_isEnable}
		 * 
		 */
		public function setKeyboardEnabled(key:Number,isEnable:Boolean):void
		{
			if(key >= 0 )
			{
				this._keyboards[key] = isEnable;
			}
			
		}
		
		//ESC 停止编辑
		private function onKeyDown(event:KeyboardEvent):void
		{
			var keyCode:int = event.keyCode;
			if(keyCode === 27 && this._keyboards[27])
			{
				this.onEndEdit(null);
				this.resetHistoryVarables();
				
			}
			
			if(keyCode == 90 && this._keyboards[90])
			{
				this.viewPreFeature();
			}
			
			if(keyCode == 89 && this._keyboards[89])
			{
				this.viewNextFeature();
			}
		}
		
		
		//uodo和 redo浏览数据的各个参数重置
		private function resetHistoryVarables():void
		{
			this.viewFeature = null;
			this.viewGeometryIndex = 0;
			this.viewGeometrySet = [];
		}
		private function onFeatureClick(event:MouseEvent):void
		{
			var feature:Feature = event.target as Feature;
			// 样式为图片时，取currentTarget
			if(!feature)
			{
				feature = event.currentTarget as Feature;
			}
			
			if(this.viewFeature && this.viewFeature != feature)
			{
				resetHistoryVarables();
			}
			
			if(this._edittingFeature)
			{
				if(feature == this._edittingFeature)
					return;
				else
				{
					this.onEndEdit(null);
				}
			}
			
			this._edittingFeature = feature;
			this.tempFeature = feature;
			this.viewFeature = feature;
			
			//进入编辑状态时，保存当前要素的几何对象
			if(!this.viewGeometrySet.length)
				this.addGeometryHandler(this._edittingFeature.geometry.clone());
			
			startDraw();
			beginEdit(feature);
			this._isEndEditting = false;
			this.map.setFocus();
			this.map.layerContainer.doubleClickEnabled = true;
			this.map.layerContainer.addEventListener(MouseEvent.DOUBLE_CLICK, onEndEdit);
			if(this.map.stage)
			{
				this.map.stage.addEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
			}
			
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_MOVE, onFeatureMouseMove);
			
		}
		
		private function beginEdit(feature:Feature):void
		{	
			this._edittingFeature.doubleClickEnabled = true;
			this._edittingFeature.autoMoveToTop = false;
			
			this._edittingFeature.addEventListener(MouseEvent.MOUSE_DOWN, onEdittingFeatureDown);
			
			//编辑过程中添加的辅助顶点和边线要素集合
			this._addedVertexFeatures = [];
			this._addedLineSegmentFeatures = [];
			
			if(feature.geometry is GeoPoint)
			{
				this._edittingPointFeature = this.addVertexToLayer(feature.geometry as GeoPoint);
			}
			else if(feature.geometry is GeoLine)
			{
				var geoLine:GeoLine = feature.geometry as GeoLine;
				this._edittingFeaturePartCount = geoLine.partCount;
				
				for(var i:int = 0; i < this._edittingFeaturePartCount; i++)
				{
					var linePoint2Ds:Array = geoLine.getPart(i);
					buildHoverLines(linePoint2Ds, i, true);
				}
				this._edittingFeatureParts = geoLine.parts;
			}
			else if(feature.geometry is GeoRegion)
			{
				//~ 线判定是否为标绘扩展符号
				if(feature.geometry is GeoPlotting)
				{
					var geoPosture:GeoPlotting = feature.geometry as GeoPlotting;
					//实际标绘扩展符号在这里只会有一个
					this._edittingFeaturePartCount = geoPosture.partCount;
					//
					buildControlPoints(geoPosture.controlPoints,0);
					this._edittingFeatureParts = geoPosture.parts;
				}
				else
				{
					var geoRegion:GeoRegion = feature.geometry as GeoRegion;
					this._edittingFeaturePartCount = geoRegion.partCount;
					for(var j:int = 0; j < this._edittingFeaturePartCount; j++)
					{
						var regionPoint2Ds:Array = geoRegion.getPart(j);
						buildHoverLines(regionPoint2Ds, j);
					}
					this._edittingFeatureParts = geoRegion.parts;
				}
				
			}
		}
		//~生成控制点
		private function buildControlPoints(point2Ds:Array, partIndex:int = 0, isUpdateFeature:Boolean = false):void
		{
			var singlePartAddedVertexFeatures:Array = [];
			
			
			var controlCount:int = point2Ds.length;
			
			for(var j:int = 0; j < controlCount; j++)
			{
				var vertexPoint:Point2D = point2Ds[j] as Point2D;
				var vertexFeature:Feature = addVertexToLayer(new GeoPoint(vertexPoint.x, vertexPoint.y));
				singlePartAddedVertexFeatures.push(vertexFeature);
				var vertexObject:Object = new Object();
				vertexObject["partIndex"] = partIndex;
				vertexObject["index"] = j;
				vertexFeature.attributes = vertexObject;
			}
			
			if(isUpdateFeature)
			{
				this._addedVertexFeatures.splice(partIndex, 1, singlePartAddedVertexFeatures);
			}
			else
			{
				this._addedVertexFeatures.push(singlePartAddedVertexFeatures);
			}
		}
		
		private function buildHoverLines(point2Ds:Array, partIndex:int = 0, isGeoLine:Boolean = false, isUpdateFeature:Boolean = false):void
		{
			var singlePartAddedVertexFeatures:Array = [];
			var singlePartAddedLineFeatures:Array = [];
			
			for(var i:int = 0; i < point2Ds.length - 1; i++)
			{
				var lineCurPoint:Point2D = point2Ds[i] as Point2D;
				var lineNextPoint:Point2D = point2Ds[i + 1] as Point2D;
				var linePoint2Ds:Array = [lineCurPoint, lineNextPoint];
				var lineSegmentFeature:Feature = addHoverLineSegment(linePoint2Ds); // 构建一条线段要素
				singlePartAddedLineFeatures.push(lineSegmentFeature);
				var lineObject:Object = new Object();
				lineObject["partIndex"] = partIndex;
				lineObject["index"] = i;
				lineObject["isHoverLine"] = true;
				lineSegmentFeature.attributes = lineObject;    //给每个边线要素添加属性信息
			}
			
			var vertexCount:int = point2Ds.length - 1;
			if(isGeoLine)
				vertexCount = point2Ds.length;
			
			for(var j:int = 0; j < vertexCount; j++)
			{
				var vertexPoint:Point2D = point2Ds[j] as Point2D;
				var vertexFeature:Feature = addVertexToLayer(new GeoPoint(vertexPoint.x, vertexPoint.y));
				singlePartAddedVertexFeatures.push(vertexFeature);
				var vertexObject:Object = new Object();
				vertexObject["partIndex"] = partIndex;
				vertexObject["index"] = j;
				vertexFeature.attributes = vertexObject;
			}
			
			if(isUpdateFeature)
			{
				this._addedVertexFeatures.splice(partIndex, 1, singlePartAddedVertexFeatures);
				this._addedLineSegmentFeatures.splice(partIndex, 1, singlePartAddedLineFeatures);
			}
			else
			{
				this._addedVertexFeatures.push(singlePartAddedVertexFeatures);
				this._addedLineSegmentFeatures.push(singlePartAddedLineFeatures);
			}
		}
		
		private function addVertexToLayer(geoPoint:GeoPoint):Feature
		{
			var vertexFeature:Feature = new Feature();
			vertexFeature.geometry = geoPoint;
			vertexFeature.style = this.vertexStyle;
			
			this.tempLayer.addFeature(vertexFeature);
			vertexFeature.addEventListener(MouseEvent.MOUSE_DOWN, onVertexDown);
			vertexFeature.addEventListener(MouseEvent.MOUSE_OVER, onVertexOver);
			
			if(!(this._edittingFeature.geometry is GeoPoint)) // 对于线和面要素，双击结束编辑
			{
				this.tempLayer.addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
				vertexFeature.doubleClickEnabled = true;
				vertexFeature.addEventListener(MouseEvent.DOUBLE_CLICK, onVertexDoubleClick);
			}	
			return vertexFeature;
		}
		
		//构建一条编辑辅助线段要素
		private function addHoverLineSegment(lineSegment:Array):Feature
		{
			var geoLine:GeoLine = new GeoLine();
			geoLine.addPart(lineSegment);
			var segmentFeature:Feature = new Feature();
			segmentFeature.geometry = geoLine;
			segmentFeature.style = this.hoverLineStyle;
			segmentFeature.autoMoveToTop = false;
			
			this._editLayer.addFeature(segmentFeature);
			return segmentFeature;
		}
		
		//删除编辑顶点上的捕捉点
		private function onVertexOver(event:MouseEvent):void
		{
			if(!this._edittingFeature)
				return;
			
			if(this._snapPoint)
			{
				this._editLayer.removeFeature(this._snapPoint);
				this._snapPoint = null;
			}	
		}
		
		//开始平移要素
		private function onEdittingFeatureDown(event:MouseEvent):void
		{
			this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_MOVE, onFeatureMouseMove);
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_MOVE, onEdittingFeatureMove);
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_UP, onEndMovingFeature);
			
			var pointStage:Point = new Point(event.stageX, event.stageY);
			this._lastFeaturePosition = this.map.stageToMap(pointStage);
		}
		
		//开始平移顶点
		private function onVertexDown(event:MouseEvent):void
		{
			this._draggedVertex = event.target as Feature;
			
			var nodePoint:GeoPoint = this._draggedVertex.geometry as GeoPoint;
			
			var tempFeature1:Feature = null;
			if(this.tempFeature)
			{
				tempFeature1  = new Feature(this.tempFeature.geometry?this.tempFeature.geometry.clone():null, this.tempFeature.style?this.tempFeature.style.clone():null);
				tempFeature1.removeStyleChangeListener();
				tempFeature1.attributes = this.tempFeature.attributes;
				tempFeature1.width = this.tempFeature.width;
				tempFeature1.height = this.tempFeature.height;
			}
			
			this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_MOVE, onFeatureMouseMove);
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_MOVE, onVertexMove);
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_UP, onEndMovingFeature);
			
			dispatchEvent(new EditEvent(EditEvent.DRAG_NODE_START, tempFeature1,new Point2D(nodePoint.x,nodePoint.y)));
		}
		
		//移动编辑要素结束后
		private function onEndMovingFeature(event:MouseEvent):void
		{
			//对于移动要素或要素节点   编辑结束之后，保存当前对象的几何信息
			var lastSavedGeometry:Geometry = this.viewGeometrySet[this.viewGeometryIndex];
			
			if(!this._edittingFeature.geometry.equals(lastSavedGeometry))
				this.addGeometryHandler(this._edittingFeature.geometry.clone());
			
			if(this._draggedVertex)
			{
				var nodePoint:GeoPoint = this._draggedVertex.geometry as GeoPoint;
				this._draggedVertex = null;
				this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_MOVE, onVertexMove);
				var tempFeature1:Feature = null;
				if(this.tempFeature)
				{
					tempFeature1  = new Feature(this.tempFeature.geometry?this.tempFeature.geometry.clone():null, this.tempFeature.style?this.tempFeature.style.clone():null);
					tempFeature1.removeStyleChangeListener();
					tempFeature1.attributes = this.tempFeature.attributes;
					tempFeature1.width = this.tempFeature.width;
					tempFeature1.height = this.tempFeature.height;
				}
				dispatchEvent(new EditEvent(EditEvent.DRAG_NODE_END, tempFeature1,new Point2D(nodePoint.x,nodePoint.y)));
			}
			else
			{
				this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_MOVE, onEdittingFeatureMove);
			}
			this.map.layerHolder.addEventListener(MouseEvent.MOUSE_MOVE, onFeatureMouseMove);
			this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_UP, onEndMovingFeature);
		}
		
		//移动正在编辑的要素
		private function onEdittingFeatureMove(event:MouseEvent):void
		{
			var pointStage:Point = new Point(event.stageX, event.stageY);
			var newPosition:Point2D = this.map.stageToMap(pointStage);
			
			var detaX:Number = this._lastFeaturePosition.x - newPosition.x;
			var detaY:Number = this._lastFeaturePosition.y - newPosition.y;
			
			this._lastFeaturePosition = newPosition;
			
			if(this._edittingFeature.geometry is GeoLine)
			{
				var geoLine:GeoLine = this._edittingFeature.geometry as GeoLine;
				
				for(var i:int = 0; i < this._edittingFeaturePartCount; i++)
				{
					var linePoint2Ds:Array = geoLine.getPart(i);
					var linePointsLength:int = linePoint2Ds.length;
					for(var j:int = 0; j < linePointsLength; j++)
					{
						var lineP:Point2D = linePoint2Ds[j];
						linePoint2Ds.splice(j, 1, new Point2D(lineP.x - detaX, lineP.y - detaY));
					}
					geoLine.removePart(i);
					geoLine.insertPart(i, linePoint2Ds);
				}
				
				this._edittingFeature.geometry = geoLine;
				this._edittingFeatureParts = geoLine.parts;
			}
			else // if(this._edittingFeature.geometry is GeoRegion)
			{
				//~
				if(this._edittingFeature.geometry is GeoPlotting)
				{
					var geoPosture:GeoPlotting = this._edittingFeature.geometry as GeoPlotting;
					if(geoPosture){
						for(var m:int = 0; m < geoPosture.controlPoints.length; m++)
						{
							var regionP:Point2D =  geoPosture.controlPoints[m] as Point2D;
							regionP.x = regionP.x - detaX;
							regionP.y = regionP.y - detaY;
							
						}
					}
				}
				var geoRegion:GeoRegion = this._edittingFeature.geometry as GeoRegion;
				
				if(geoRegion){
					for(var m2:int = 0; m2 < this._edittingFeaturePartCount; m2++)
					{
						var regionPoint2Ds:Array = geoRegion.getPart(m2);
						var regionPointsLength:int = regionPoint2Ds.length;
						for(var n:int = 0; n < regionPointsLength; n++)
						{
							var regionP2:Point2D = regionPoint2Ds[n];
							regionPoint2Ds.splice(n, 1, new Point2D(regionP2.x - detaX, regionP2.y - detaY));
						}
						geoRegion.removePart(m2);
						geoRegion.insertPart(m2, regionPoint2Ds);
					}
					this._edittingFeature.geometry = geoRegion;
					this._edittingFeatureParts = geoRegion.parts;
				}
			
			}
			
			for(var s:int = 0; s < this._edittingFeaturePartCount; s++)
			{
				for each(var vertexFeature:Feature in this._addedVertexFeatures[s])
				{
					var vertexGeoPoint:GeoPoint = vertexFeature.geometry as GeoPoint;
					vertexFeature.geometry = new GeoPoint(vertexGeoPoint.x - detaX, vertexGeoPoint.y - detaY);
				}
				
				for each(var lineFeature:Feature in this._addedLineSegmentFeatures[s])
				{
					var segmentGeoLine:GeoLine = lineFeature.geometry as GeoLine;
					var ps:Array = segmentGeoLine.getPart(0);
					var psLength:int = ps.length;
					for(var q:int = 0; q < psLength; q++)
					{
						var segmentP:Point2D = ps[q];
						ps.splice(q, 1, new Point2D(segmentP.x - detaX, segmentP.y - detaY));
					}
					segmentGeoLine.removePart(0);
					segmentGeoLine.addPart(ps);
					lineFeature.geometry = segmentGeoLine;
				}
			}
		}
		
		/**
		 * ${actions_Edit_attribute_isLastViewFeature_D} 
		 * @return 
		 * 
		 */	
		public function get isLastViewFeature() : Boolean
		{
			return this.viewGeometryIndex == (this.viewGeometrySet.length - 1);
		}
		
		/**
		 * ${actions_Edit_attribute_isFirstViewFeature_D} 
		 * @return 
		 * 
		 */	
		public function get isFirstViewFeature() : Boolean
		{
			return this.viewGeometryIndex <= 0;
		}
		
		
		/**
		 * ${actions_Edit_method_viewPreFeature_D}
		 * 
		 */	
		public function viewPreFeature() : void
		{
			if (isFirstViewFeature)
			{
				return;
			}
			
			this.clearHighlightFeatures();
			
			this.viewGeometryIndex -= 1;
			
			if (this.viewGeometryIndex < 0)
			{
				this.viewGeometryIndex = 0;
			}
			
			this.viewFeature.geometry = this.viewGeometrySet[this.viewGeometryIndex].clone();
			
			this.beginEdit(_edittingFeature);
		}
		
		/**
		 * ${actions_Edit_method_viewNextFeature_D}
		 * 
		 */	
		public function viewNextFeature() : void
		{
			if (isLastViewFeature)
			{
				return;
			}
			
			this.clearHighlightFeatures();
			
			this.viewGeometryIndex += 1;
			
			if (this.viewGeometryIndex > this.viewGeometrySet.length)
			{
				this.viewGeometryIndex = this.viewGeometrySet.length;
			}
			
			this.viewFeature.geometry = this.viewGeometrySet[this.viewGeometryIndex].clone();
			
			this.beginEdit(_edittingFeature);
		}
		
		private function addGeometryHandler(geo:Geometry):void
		{
			if(geo)
			{
				this.viewGeometrySet = this.viewGeometrySet.splice(0, (this.viewGeometryIndex + 1));
				this.viewGeometrySet.push(geo.clone());
				this.viewGeometryIndex = this.viewGeometrySet.length - 1;
			}
		}
		
		//移动顶点
		private function onVertexMove(event:MouseEvent):void
		{
			var pointStage:Point = new Point(event.stageX, event.stageY);
			var newPoint2D:Point2D = this.map.stageToMap(pointStage);
			if(this.snap)
			{
				newPoint2D = this.snap.getSnapPoint(newPoint2D);
			}
			if(this._edittingFeature.geometry is GeoPoint) // 点要素编辑，移动点的位置
			{
				this._draggedVertex.geometry = new GeoPoint(newPoint2D.x, newPoint2D.y);
				this._edittingFeature.geometry = new GeoPoint(newPoint2D.x, newPoint2D.y);
				return;
			}
			
			this._draggedVertex.geometry = new GeoPoint(newPoint2D.x, newPoint2D.y);
			
			
			var partIndex:int = this._draggedVertex.attributes["partIndex"];
			var curPartPoint2Ds:Array = this._edittingFeatureParts[partIndex];
			var vertexIndex:int = this._draggedVertex.attributes["index"];
			
			//~修改高亮的控制点以及自身的控制点
			if(this._edittingFeature.geometry is GeoPlotting)
			{
				//跟换自身点
				//这里的partIndex必定为0，所以不需要此参数
				var geo:GeoPlotting = this._edittingFeature.geometry as GeoPlotting;
				geo.controlPoints[vertexIndex] = new Point2D(newPoint2D.x,newPoint2D.y);
				geo.controlPoints = geo.controlPoints;
				//跟换高亮点
				var points:Array = this._addedVertexFeatures[0] as Array;
				var fea:Feature = points[vertexIndex] as Feature;
				var geoP:GeoPoint = fea.geometry as GeoPoint;
				geoP.x = newPoint2D.x;
				geoP.y = newPoint2D.y;
				fea.geometry = geoP;
				return;
			}
			
			curPartPoint2Ds.splice(vertexIndex, 1, newPoint2D);
			
			var isGeoLine:Boolean = false;
			isGeoLine = this._edittingFeature.geometry is GeoLine;
			if(isGeoLine)
			{
				var parentGeoLine:GeoLine = this._edittingFeature.geometry as GeoLine;
				parentGeoLine.removePart(partIndex);
				parentGeoLine.insertPart(partIndex, curPartPoint2Ds);
				this._edittingFeature.geometry = parentGeoLine;
			}
			else// if(this._edittingFeature.geometry is GeoRegion)
			{
				if(vertexIndex == 0)
					curPartPoint2Ds.splice(curPartPoint2Ds.length - 1, 1, newPoint2D);
				
				var parentGeoRegion:GeoRegion = this._edittingFeature.geometry as GeoRegion;
				parentGeoRegion.removePart(partIndex);
				parentGeoRegion.insertPart(partIndex, curPartPoint2Ds);
				this._edittingFeature.geometry = parentGeoRegion;
			}
			
			var preSegment:Feature = null;
			var afterSegment:Feature = null;
			var preSegmentIndex:int = -1;
			var afterSegmentIndex:int = -1;
			var prePoints:Array;
			var afterPoints:Array;
			var currentPartVertexFeatures:Array = this._addedVertexFeatures[partIndex];
			var currentPartLineFeatures:Array = this._addedLineSegmentFeatures[partIndex];
			
			if(vertexIndex == 0)
			{
				//				this._editLayer.moveToTop(currentPartVertexFeatures[1]);
				afterSegmentIndex = 0;
				afterPoints = [curPartPoint2Ds[0],  curPartPoint2Ds[1]];
				
				if(!(this._edittingFeature.geometry is GeoLine)) // 表示线段第一个点，只变化顶点后面的捕捉线段
				{
					prePoints = [curPartPoint2Ds[curPartPoint2Ds.length - 1],  curPartPoint2Ds[curPartPoint2Ds.length - 2]];
					preSegmentIndex = currentPartLineFeatures.length - 1;
				}
			}
			else
			{
				preSegmentIndex = vertexIndex - 1;
				prePoints = [curPartPoint2Ds[vertexIndex],  curPartPoint2Ds[vertexIndex - 1]];
				
				if(!(vertexIndex == curPartPoint2Ds.length - 1))// 表示线段最后一个点，只变化顶点前面的捕捉线段
				{
					afterSegmentIndex = vertexIndex;
					afterPoints = [curPartPoint2Ds[vertexIndex],  curPartPoint2Ds[vertexIndex + 1]];
				}
			}
			
			if(preSegmentIndex > -1) // 如果preSegmentIndex = -1 ，表示当前的feature为线段要素，顶点是线段的第一个点
			{
				preSegment = currentPartLineFeatures[preSegmentIndex];
				var preGeoLine:GeoLine = preSegment.geometry as GeoLine;
				preGeoLine.removePart(0);
				preGeoLine.addPart(prePoints);
				preSegment.geometry = preGeoLine;
			}
			
			if(afterSegmentIndex > -1) // 如果afterSegmentIndex = -1 ，表示当前的feature为线段要素，顶点是线段的最后一个点
			{
				afterSegment = currentPartLineFeatures[afterSegmentIndex];
				var afterGeoLine:GeoLine = afterSegment.geometry as GeoLine;
				afterGeoLine.removePart(0);
				afterGeoLine.addPart(afterPoints);
				afterSegment.geometry = afterGeoLine;
			}
		}
		
		public function updateCurrentPartFeature(point2Ds:Array, partIndex:int):void
		{
			this._isRemoveFeature = true;
			var isGeoLine:Boolean = false;
			isGeoLine = this._edittingFeature.geometry is GeoLine;
			if(isGeoLine)
			{
				var parentGeoLine:GeoLine = this._edittingFeature.geometry as GeoLine;
				parentGeoLine.removePart(partIndex);
				parentGeoLine.insertPart(partIndex, point2Ds);
				this._edittingFeature.geometry = parentGeoLine;
			}
			else// if(this._edittingFeature.geometry is GeoRegion)
			{
				var parentGeoRegion:GeoRegion = this._edittingFeature.geometry as GeoRegion;
				parentGeoRegion.removePart(partIndex);
				parentGeoRegion.insertPart(partIndex, point2Ds);
				this._edittingFeature.geometry = parentGeoRegion;
			}
			
			this.commonRemoveCurrentPartFeatures(partIndex);
			this._isRemoveFeature = false;
			this.buildHoverLines(point2Ds, partIndex, isGeoLine, true);
		}
		
		//双击删除顶点
		private function onVertexDoubleClick(event:MouseEvent):void
		{
			var vertex:Feature = event.target as Feature;
			
			if(vertex.geometry is GeoPoint)
			{			
				var partIndex:int = vertex.attributes["partIndex"];
				var point2Ds:Array = this._edittingFeatureParts[partIndex];
				var vertexIndex:int = vertex.attributes["index"];
				
				if(this._edittingFeature.geometry is GeoLine && point2Ds.length < 3)
					return;
				else if(this._edittingFeature.geometry is GeoRegion && point2Ds.length < 5)
					return;
				
				if(vertexIndex == 0)
				{
					if(this._edittingFeature.geometry is GeoLine)
					{
						point2Ds.shift();
					}
					else
					{
						point2Ds.shift();
						point2Ds.pop();
						point2Ds.push(point2Ds[0]);
					}
				}
				else
					point2Ds.splice(vertexIndex, 1);
				this.updateCurrentPartFeature(point2Ds, partIndex);	
				
				//				var lastSavedGeometry:Geometry = this.viewGeometrySet[this.viewGeometryIndex];
				//				
				//				if(!this._edittingFeature.geometry.equals(lastSavedGeometry))
				//双击删除节点后，添加当前的对象几何信息
				this.addGeometryHandler(this._edittingFeature.geometry.clone());
			}
		}
		
		private function commonRemoveCurrentPartFeatures(partIndex:int):void
		{
			
			for each(var lineFeature:Feature in this._addedLineSegmentFeatures[partIndex])
			{
				this._editLayer.removeFeature(lineFeature);
			}
			
			for each(var vertexFeature:Feature in this._addedVertexFeatures[partIndex])
			{
				this.tempLayer.removeFeature(vertexFeature);
//				//~这里需要判定一下是否存在，不存在了就不需要移除了
//				if(this.tempLayer.getFeatureIndex(vertexFeature)>-1)
//				{
//					
//				}
			}
		}
		
		private function removeAllFeaturesHandler(event:FeatureLayerEvent):void
		{
			this.map.removeEventListener(MouseEvent.DOUBLE_CLICK, onEndEdit);
			if(this.tempLayer)
			{
				this.tempFeature = null;
				this.tempLayer.clear();
			}
			if(!this._isEndEditting)
				this.resetVarables();
		}
		
		private function removeFeatureHandler(event:FeatureLayerEvent):void
		{
			if(this._isRemoveFeature)
				return;
			
			if(event.feature == this._edittingFeature)
			{
				if(this.tempLayer && this._editLayer)
				{
					//					this.tempFeature = null;
					//					this.tempLayer.clear();
					
					for(var s:int = 0; s < this._edittingFeaturePartCount; s++)
					{
						this.commonRemoveCurrentPartFeatures(s);
					}
				}
				this.resetVarables();
			}
			
			this.map.removeEventListener(MouseEvent.DOUBLE_CLICK, onEndEdit);
		}
		
		//		private function addFeatureHandler(event:FeatureLayerEvent):void
		//		{
		//			var addedFeature:Feature = event.feature;
		//			addedFeature.addEventListener(MouseEvent.CLICK, onFeatureClick);
		//		}
		
		private function onEndEdit(event:MouseEvent):void
		{
			if(!this._edittingFeature)
				return;
			
			if(event)
			{
				var feature:Object = event.target;
				if(feature is Feature)
				{
					if((feature as Feature).geometry is GeoPoint)
						return;
				}
				//双击结束编辑，重置redo/undo的设置参数
				this.resetHistoryVarables(); 
				this.map.layerContainer.removeEventListener(MouseEvent.DOUBLE_CLICK, onEndEdit); //event 存在说明是双节结束编辑而不是切换feature结束编辑的
				
				event.stopPropagation();
			}
			
			this._isRemoveFeature = true;
			this.tempFeature = this._edittingFeature;
			this.viewFeature = this._edittingFeature;
			//			if(this._editLayer.contains(this._edittingFeature))
			//			{
			//				this._editLayer.removeFeature(this._edittingFeature);
			//			}
			
			//			this._edittingFeature.addEventListener(MouseEvent.CLICK, onFeatureClick);
			
			this.clearHighlightFeatures();
			
			this._isEndEditting = true;
			
			this.endDraw(); //结束编辑，删除templayer
			resetVarables();
		}
		
		private function clearHighlightFeatures():void
		{
			if(this._edittingPointFeature)
			{
				this.tempLayer.removeFeature(this._edittingPointFeature);
				this._isRemoveFeature = false;
				this._edittingPointFeature = null;
			}
			
			for(var s:int = 0; s < this._edittingFeaturePartCount; s++)
			{
				this.commonRemoveCurrentPartFeatures(s);
			}
		}
		
		private function resetVarables():void
		{
			if(this._edittingFeature)
			{
				this._edittingFeature.removeEventListener(MouseEvent.MOUSE_DOWN, onEdittingFeatureDown);
				this._edittingFeature = null;
			}
			this._draggedVertex = null;
			if(!this._isEndEditting)
				this._isEndEditting = true;
			this._isRemoveFeature = false;
			this._catchedLine = null;
			this._snapPoint = null;
			this._lastFeaturePosition = null;
			this.map.layerHolder.removeEventListener(MouseEvent.MOUSE_MOVE, onFeatureMouseMove);
		}
		
		/**
		 * @inheritDoc 
		 * @param event
		 * 
		 */
		override protected function onMouseDown(event:MouseEvent):void
		{
			if(!this._edittingFeature || !this._snapPoint)
				return;
			
			var feature:Object = event.target;
			if((feature as Feature).geometry == this._snapPoint.geometry)
			{			
				
				var partIndex:int = this._catchedLine.attributes["partIndex"];
				var catchedLineIndex:int = this._catchedLine.attributes["index"];
				var point2Ds:Array = this._edittingFeatureParts[partIndex];
				
				var newVertex:GeoPoint = this._snapPoint.geometry as GeoPoint;
				
				//				var linePoint2Ds:Array = (this._catchedLine.geometry as GeoLine).getPart(0);
				var newVertexPoint2D:Point2D = new Point2D(newVertex.x, newVertex.y);
				
				point2Ds.splice(catchedLineIndex + 1, 0, newVertexPoint2D);
				this.updateCurrentPartFeature(point2Ds, partIndex);	
				
				//添加新节点时，保存当前要素的几何对象
				this.addGeometryHandler(this._edittingFeature.geometry.clone());
				
				//添加增加节点时的事件
				var tempFeature1:Feature = null;
				if(this.tempFeature)
				{
					tempFeature1  = new Feature(this.tempFeature.geometry?this.tempFeature.geometry.clone():null, this.tempFeature.style?this.tempFeature.style.clone():null);
					tempFeature1.removeStyleChangeListener();
					tempFeature1.attributes = this.tempFeature.attributes;
					tempFeature1.width = this.tempFeature.width;
					tempFeature1.height = this.tempFeature.height;
					
				}
				dispatchEvent(new EditEvent(EditEvent.ADD_NODE, tempFeature1,new Point2D(newVertex.x, newVertex.y)));
			}
		}
		
		//求线外一点到线上垂足的算法
		private function findNearestPoint(geoLine:GeoLine, p:Point2D):GeoPoint
		{
			var point2Ds:Array = geoLine.getPart(0);
			var p0:Point2D = point2Ds[0];
			var p1:Point2D = point2Ds[1];
			
			var pp0:GeoPoint = new GeoPoint(p.x - p0.x, p.y - p0.y);
			var p1p0:GeoPoint = new GeoPoint(p1.x - p0.x, p1.y - p0.y);
			
			var coefficient:Number = (pp0.x * p1p0.x + pp0.y * p1p0.y) / (p1p0.x * p1p0.x + p1p0.y * p1p0.y);
			if (coefficient < 0.0)
			{
				coefficient = 0.0;
			}
			else if (coefficient > 1.0)
			{
				coefficient = 1.0;
			}
			return new GeoPoint(p0.x + p1p0.x * coefficient, p0.y + p1p0.y * coefficient);
		}
		
		private function onFeatureMouseMove(event:MouseEvent):void
		{
			if(!this._edittingFeature)
				return;
			
			var feature:Object = event.target;
			if(feature is Feature)
			{
				//~
				if((feature as Feature).geometry is GeoPlotting)
				{
					return;
				}
				if((feature as Feature).geometry is GeoLine)
				{
					var tempAttributes:Object = (feature as Feature).attributes;
					if(!tempAttributes || !tempAttributes.isHoverLine)
						return;			
					
					this._catchedLine = event.target as Feature;
					var geoLine:GeoLine = this._catchedLine.geometry as GeoLine;
					
					var pointStage:Point = new Point(event.stageX, event.stageY);
					var point2DLocal:Point2D = this.map.stageToMap(pointStage);
					var geo:GeoPoint = this.findNearestPoint(geoLine, point2DLocal);
					if(!this._snapPoint)
					{
						this._snapPoint = new Feature();
						this._snapPoint.geometry = new GeoPoint(point2DLocal.x, point2DLocal.y);
						this._snapPoint.style = this._snapStyle;
						
						this._editLayer.addFeature(this._snapPoint);
						this._editLayer.moveToTop(this._snapPoint);
						//						this._editLayer.setChildIndex(this._snapPoint, this._editLayer.numFeatures - this._addedVertexFeatures.length - 1);
					}
					else
						this._snapPoint.geometry = new GeoPoint(geo.x, geo.y);
				}
				else
				{
					if(this._snapPoint)
					{
						var geoLine0:GeoLine = this._catchedLine.geometry as GeoLine;
						var pointStage0:Point = new Point(event.stageX, event.stageY);
						
						var point2DLocal0:Point2D = this.map.stageToMap(pointStage0);
						
						var geo0:GeoPoint = this.findNearestPoint(geoLine0, point2DLocal0);
						
						var dx:Number = geo0.x - point2DLocal0.x;
						var dy:Number = geo0.y - point2DLocal0.y;
						
						var lineDistance:Number = Math.sqrt(dx * dx + dy * dy) / this.map.resolution;
						if(lineDistance > 10)
						{
							this._editLayer.removeFeature(this._snapPoint);
							this._snapPoint = null;
						}
						else
							this._snapPoint.geometry = new GeoPoint(geo0.x, geo0.y);
					}	
				}
			}
			else
			{
				if(this._snapPoint)
				{
					this._editLayer.removeFeature(this._snapPoint);
					this._snapPoint = null;
				}
			}
		}
	}
}