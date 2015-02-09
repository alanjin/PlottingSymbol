var isWinRT = (typeof Windows === "undefined") ? false : true;
{

    inputScript('Geometry/GeoLinePlotting.js');
    inputScript('Geometry/GeoMultiLinePlotting.js');
    inputScript('Geometry/GeoPlotting.js');
    inputScript('Handler/Plotting.js');
    inputScript('Control/PlottingEdit.js');

	//点
    inputScript('Geometry/Point/GeoPoint.js');
    inputScript('Geometry/Point/GeoMultiPoint.js');
     //线
    inputScript('Geometry/Line/GeoArc.js');
    inputScript('Geometry/Line/GeoBezierCurve2.js');
    inputScript('Geometry/Line/GeoBezierCurve3.js');
    inputScript('Geometry/Line/GeoBezierCurveN.js');
    inputScript('Geometry/Line/GeoCardinalCurve.js');
    inputScript('Geometry/Line/GeoFreeline.js');
    inputScript('Geometry/Line/GeoPolyline.js');
     //面
    inputScript('Geometry/Polygon/GeoCircle.js');
    inputScript('Geometry/Polygon/GeoCloseCurve.js');
    inputScript('Geometry/Polygon/GeoEllipse.js');
    inputScript('Geometry/Polygon/GeoFreePolygon.js');
    inputScript('Geometry/Polygon/GeoGatheringPlace.js');
    inputScript('Geometry/Polygon/GeoLune.js');
    inputScript('Geometry/Polygon/GeoPolygonEx.js');
    inputScript('Geometry/Polygon/GeoRectangle.js');
    inputScript('Geometry/Polygon/GeoRoundedRect.js');
    inputScript('Geometry/Polygon/GeoSector.js');
   //箭头、箭标、旗标
    inputScript('Geometry/ArrowAndFlag/GeoBezierCurveArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoCardinalCurveArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoCurveFlag.js');
    inputScript('Geometry/ArrowAndFlag/GeoDiagonalArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoDoubleArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoDoveTailDiagonalArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoDoveTailStraightArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoParallelSearch.js');
    inputScript('Geometry/ArrowAndFlag/GeoRectFlag.js');
    inputScript('Geometry/ArrowAndFlag/GeoSectorSearch.js');
    inputScript('Geometry/ArrowAndFlag/GeoStraightArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoPolylineArrow.js');
    inputScript('Geometry/ArrowAndFlag/GeoTriangleFlag.js');

	
    //点
    inputScript('Handler/Point/PointEx.js');
    inputScript('Handler/Point/MultiPointEx.js');
    //线
    inputScript('Handler/Line/ArcEx.js');
    inputScript('Handler/Line/BezierCurve2Ex.js');
    inputScript('Handler/Line/BezierCurve3Ex.js');
    inputScript('Handler/Line/BezierCurveNEx.js');
    inputScript('Handler/Line/CardinalCurveEx.js');
    inputScript('Handler/Line/FreelineEx.js');
    inputScript('Handler/Line/PolyLineEx.js');
    // 面
    inputScript('Handler/Polygon/CircleEx.js');
    inputScript('Handler/Polygon/CloseCurve.js');
    inputScript('Handler/Polygon/EllipseEx.js');
    inputScript('Handler/Polygon/FreePolygon.js');
    inputScript('Handler/Polygon/GatheringPlace.js');
    inputScript('Handler/Polygon/Lune.js');
    inputScript('Handler/Polygon/PolygonEx.js');
    inputScript('Handler/Polygon/Rectangle.js');
    inputScript('Handler/Polygon/RoundedRect.js');
    inputScript('Handler/Polygon/Sector.js');
    //箭头、箭标、旗标
    inputScript('Handler/ArrowAndFlag/BizerCurveArrow.js');
    inputScript('Handler/ArrowAndFlag/CardinalCurveArrow.js');
    inputScript('Handler/ArrowAndFlag/CurveFlag.js');
    inputScript('Handler/ArrowAndFlag/DiagonalArrow.js');
    inputScript('Handler/ArrowAndFlag/DoubleArrow.js');
    inputScript('Handler/ArrowAndFlag/DoveTailDiagonalArrow.js');
    inputScript('Handler/ArrowAndFlag/DoveTailStraightArrow.js');
    inputScript('Handler/ArrowAndFlag/ParallelSearch.js');
    inputScript('Handler/ArrowAndFlag/RectFlag.js');
    inputScript('Handler/ArrowAndFlag/SectorSearch.js');
    inputScript('Handler/ArrowAndFlag/StraightArrow.js');
    inputScript('Handler/ArrowAndFlag/PolylineArrow.js');
    inputScript('Handler/ArrowAndFlag/TriangleFlag.js');
   
}
function inputScript(inc){
    if (!isWinRT) {
        var script = '<' + 'script type="text/javascript" src="../iClientJavaScriptPlottingSymbols/PlottingSymbols/' + inc + '"' + '><' + '/script>';
        document.writeln(script);
    } else {
        var script = document.createElement("script");
        script.src = "../iClientJavaScriptPlottingSymbols/PlottingSymbols/" + inc;
        document.getElementsByTagName("HEAD")[0].appendChild(script);
    }
}
