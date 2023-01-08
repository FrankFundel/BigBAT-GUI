import {
  lightningChart,
  PalettedFill,
  LUT,
  emptyFill,
  emptyLine,
  AxisScrollStrategies,
  LegendBoxBuilders,
  ColorHSV,
  translatePoint,
  synchronizeAxisIntervals,
  Themes,
  AxisTickStrategies,
  ColorCSS,
  SolidFill,
  SolidLine,
  customTheme,
} from "@arction/lcjs";
import React, { useRef, useEffect, useState } from "react";

const Spectrogram = (props) => {
  const { data, id, cols, rows, maxF, maxS, init } = props;
  const chartRef = useRef(undefined);

  var loading = false;

  useEffect(() => {
    console.log("create chart");

    const themeTextFillStyle = new SolidFill({ color: ColorCSS("#fff") });
    const themeDataSeriesFillStyles = [
      new SolidFill({ color: ColorCSS("#42a5f5") }),
      new SolidFill({ color: ColorCSS("#fff") }),
    ];
    const themeAxisFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });
    const themeMajorTickFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });
    const themeMinorTickFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });
    const themeMajorGridlineFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });
    const themeMinorGridlineFillStyle = new SolidFill({
      color: ColorCSS("#00000014"),
    });
    const themeUiBackgroundFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });
    const themeUiBackgroundBorderFillStyle = new SolidFill({
      color: ColorCSS("#2b2b2b"),
    });
    const themeCursorGridlineFillStyle = new SolidFill({
      color: ColorCSS("rgba(255, 255, 255, 0.12)"),
    });

    const myTheme = customTheme(Themes.lightNew, {
      lcjsBackgroundFillStyle: new SolidFill({ color: ColorCSS("#121212") }),
      panelBackgroundFillStyle: new SolidFill({ color: ColorCSS("#121212") }),
      seriesBackgroundFillStyle: new SolidFill({ color: ColorCSS("#121212") }),
      chartTitleFillStyle: themeTextFillStyle,
      axisTitleFillStyle: themeTextFillStyle,
      axisStyle: new SolidLine({ thickness: 2, fillStyle: themeAxisFillStyle }),
      numericTickStrategy: Themes.lightNew.numericTickStrategy
        .setMajorTickStyle((majorTicks) =>
          majorTicks
            .setLabelFillStyle(themeTextFillStyle)
            .setTickStyle(
              new SolidLine({
                thickness: 1,
                fillStyle: themeMajorTickFillStyle,
              })
            )
            .setGridStrokeStyle(
              new SolidLine({
                thickness: 1,
                fillStyle: themeMajorGridlineFillStyle,
              })
            )
        )
        .setMinorTickStyle((minorTicks) =>
          minorTicks
            .setLabelFillStyle(themeTextFillStyle)
            .setTickStyle(
              new SolidLine({
                thickness: 1,
                fillStyle: themeMinorTickFillStyle,
              })
            )
            .setGridStrokeStyle(
              new SolidLine({
                thickness: 1,
                fillStyle: themeMinorGridlineFillStyle,
              })
            )
        ),
      seriesFillStyle: (i) =>
        themeDataSeriesFillStyles[i % themeDataSeriesFillStyles.length],
      seriesStrokeStyle: (i) =>
        new SolidLine({
          thickness: 2,
          fillStyle:
            themeDataSeriesFillStyles[i % themeDataSeriesFillStyles.length],
        }),
      uiBackgroundFillStyle: themeUiBackgroundFillStyle,
      uiBackgroundStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: themeUiBackgroundBorderFillStyle,
      }),
      uiTextFillStyle: themeTextFillStyle,
      resultTableFillStyle: themeUiBackgroundFillStyle,
      resultTableStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: themeUiBackgroundBorderFillStyle,
      }),
      resultTableTextFillStyle: themeTextFillStyle,
      customTickGridStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: themeCursorGridlineFillStyle,
      }),
      uiPointableTextBoxFillStyle: themeUiBackgroundFillStyle,
      uiPointableTextBoxStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: themeUiBackgroundBorderFillStyle,
      }),
      uiPointableTextBoxTextFillStyle: themeTextFillStyle,
      pointMarkerFillStyle: new SolidFill({
        color: ColorCSS("rgba(255, 255, 255, 0.12)"),
      }),
      chartXYZoomingRectangleFillStyle: new SolidFill({
        color: ColorCSS("#00000016"),
      }),
      chartXYZoomingRectangleStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: new SolidFill({ color: ColorCSS("#4f4f4f") }),
      }),
      chartXYFittingRectangleFillStyle: new SolidFill({
        color: ColorCSS("#00000016"),
      }),
      chartXYFittingRectangleStrokeStyle: new SolidLine({
        thickness: 1,
        fillStyle: new SolidFill({ color: ColorCSS("#4f4f4f") }),
      }),
    });

    // Create charts and series.

    const dashboard = lightningChart({
      license: "",
    })
      .Dashboard({
        theme: myTheme,
        numberOfColumns: 2,
        numberOfRows: 2,
        disableAnimations: true,
        container: id,
      })
      .setColumnWidth(0, 1)
      .setColumnWidth(1, 0.2)
      .setRowHeight(0, 1)
      .setRowHeight(1, 0.3);

    const chartSpectrogram = dashboard
      .createChartXY({
        columnIndex: 0,
        rowIndex: 0,
      })
      .setTitle("")
      .setPadding({ left: 40, bottom: 30 });

    const maxI = 255;
    const seriesSpectrogram = chartSpectrogram
      .addHeatmapGridSeries({
        columns: cols,
        rows: rows,
      })
      .setMouseInteractions(false)
      .setWireframeStyle(emptyLine)
      .setFillStyle(
        new PalettedFill({
          lookUpProperty: "value",
          lut: new LUT({
            interpolate: true,
            steps: [
              { value: 0 * maxI, label: "0.0", color: ColorHSV(0, 1, 0) },
              {
                value: 0.2 * maxI,
                label: "0.2",
                color: ColorHSV(270, 0.84, 0.2),
              },
              {
                value: 0.4 * maxI,
                label: "0.4",
                color: ColorHSV(289, 0.86, 0.35),
              },
              {
                value: 0.6 * maxI,
                label: "0.6",
                color: ColorHSV(324, 0.97, 0.56),
              },
              { value: 0.8 * maxI, label: "0.8", color: ColorHSV(1, 1, 1) },
              { value: 1.0 * maxI, label: "1.0", color: ColorHSV(44, 0.64, 1) },
            ],
          }),
        })
      );

    seriesSpectrogram.axisY.setTitle("Frequency (kHz)");
    seriesSpectrogram.axisX.setTitle("Time (s)");

    const chartProjectionY = dashboard
      .createChartXY({
        columnIndex: 1,
        rowIndex: 0,
      })
      .setTitleFillStyle(emptyFill)
      // NOTE: Hardcoded alignment with Spectrogram chart.
      .setPadding({ top: 10 })
      .setMouseInteractions(false);

    chartProjectionY
      .getDefaultAxisY()
      .setScrollStrategy(undefined)
      .setMouseInteractions(false);

    // Sync projection Axis with spectogram chart projected axis.
    synchronizeAxisIntervals(
      chartSpectrogram.getDefaultAxisY(),
      chartProjectionY.getDefaultAxisY()
    );

    chartProjectionY
      .getDefaultAxisX()
      .setScrollStrategy(AxisScrollStrategies.expansion)
      .setInterval(0, 1)
      .setMouseInteractions(false);

    const seriesProjectionY = chartProjectionY
      .addLineSeries({
        dataPattern: {
          pattern: "ProgressiveY",
          regularProgressiveStep: true,
        },
      })
      .setName("Projection (Y)")
      .setCursorSolveBasis("nearest-y");

    const chartProjectionX = dashboard
      .createChartXY({
        columnIndex: 0,
        rowIndex: 1,
      })
      .setTitleFillStyle(emptyFill)
      .setMouseInteractions(false);
    chartProjectionX
      .getDefaultAxisX()
      .setScrollStrategy(undefined)
      .setMouseInteractions(false);

    // Sync projection Axis with spectogram chart projected axis.
    synchronizeAxisIntervals(
      chartSpectrogram.getDefaultAxisX(),
      chartProjectionX.getDefaultAxisX()
    );

    chartProjectionX
      .getDefaultAxisY()
      .setScrollStrategy(AxisScrollStrategies.expansion)
      .setInterval(0, 1)
      .setMouseInteractions(false);
    const seriesProjectionX = chartProjectionX
      .addLineSeries({
        dataPattern: {
          pattern: "ProgressiveX",
          regularProgressiveStep: true,
        },
      })
      .setName("Projection (X)");

    // Align charts nicely.
    chartSpectrogram.getDefaultAxisY().setThickness(50);
    chartProjectionX.getDefaultAxisY().setThickness(50);
    chartSpectrogram.getDefaultAxisX().setThickness(25);
    chartProjectionY.getDefaultAxisX().setThickness(25);

    // Set chart
    chartRef.current = {
      seriesSpectrogram,
      seriesProjectionX,
      seriesProjectionY,
      chartSpectrogram,
      chartProjectionX,
      chartProjectionY,
    };

    return () => {
      console.log("destroy chart");
      dashboard.dispose();
      chartRef.current = undefined;
    };
  }, [id, init]);

  useEffect(() => {
    const components = chartRef.current;
    if (!components) return;

    var {
      seriesSpectrogram,
      seriesProjectionX,
      seriesProjectionY,
      chartSpectrogram,
      chartProjectionX,
      chartProjectionY,
    } = components;
    const { maxF, maxS, cols, rows, loadMore } = props;

    loading = false;
    let maxI = 255;
    seriesSpectrogram = chartSpectrogram
      .addHeatmapGridSeries({
        columns: cols,
        rows: rows,
      })
      .setMouseInteractions(false)
      .setWireframeStyle(emptyLine)
      .setFillStyle(
        new PalettedFill({
          lookUpProperty: "value",
          lut: new LUT({
            interpolate: true,
            steps: [
              { value: 0 * maxI, label: "0.0", color: ColorHSV(0, 1, 0) },
              {
                value: 0.2 * maxI,
                label: "0.2",
                color: ColorHSV(270, 0.84, 0.2),
              },
              {
                value: 0.4 * maxI,
                label: "0.4",
                color: ColorHSV(289, 0.86, 0.35),
              },
              {
                value: 0.6 * maxI,
                label: "0.6",
                color: ColorHSV(324, 0.97, 0.56),
              },
              { value: 0.8 * maxI, label: "0.8", color: ColorHSV(1, 1, 1) },
              { value: 1.0 * maxI, label: "1.0", color: ColorHSV(44, 0.64, 1) },
            ],
          }),
        })
      );
    seriesSpectrogram.clear().invalidateIntensityValues(data);

    chartSpectrogram
      .getDefaultAxisX()
      .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) =>
        tickStrategy.setFormattingFunction((value, range) => {
          return (value / maxS).toFixed(2);
        })
      );
    chartSpectrogram
      .getDefaultAxisY()
      .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) =>
        tickStrategy.setFormattingFunction((value, range) => {
          return (value / maxF).toFixed(2);
        })
      );
    chartProjectionX
      .getDefaultAxisX()
      .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) =>
        tickStrategy.setFormattingFunction((value, range) => {
          return (value / maxS).toFixed(2);
        })
      );
    chartProjectionY
      .getDefaultAxisY()
      .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) =>
        tickStrategy.setFormattingFunction((value, range) => {
          return (value / maxF).toFixed(2);
        })
      );

    chartSpectrogram.onSeriesBackgroundMouseDrag((_, event) => {
      const x = seriesSpectrogram.axisX.getInterval().end;
      if (x > cols + 0.25 * maxS && loading == false) {
        loadMore(cols);
        loading = true;
      }
    });

    // Add custom interaction when mouse is hovered over spectrogram chart.
    chartSpectrogram.onSeriesBackgroundMouseMove((_, event) => {
      // Solve mouse location on Axis.
      const locationAxis = translatePoint(
        chartSpectrogram.engine.clientLocation2Engine(
          event.clientX,
          event.clientY
        ),
        chartSpectrogram.engine.scale,
        seriesSpectrogram.scale
      );

      // Calculate spectrogram 1D projections at axis location for both X and Y planes.
      let projectionY;
      try {
        projectionY = data[Math.round(locationAxis.x)].map((value, i) => ({
          x: value,
          y: i,
        }));
      } catch (e) {}

      let projectionX;
      try {
        projectionX = [];
        const row = Math.round(locationAxis.y);
        for (let x = 0; x < cols; x += 1) {
          projectionX[x] = {
            x,
            y: data[x][row],
          };
        }
      } catch (e) {}

      // Update projection series data.
      seriesProjectionY.clear();
      if (projectionY) {
        seriesProjectionY.add(projectionY);
      }

      seriesProjectionX.clear();
      if (projectionX) {
        seriesProjectionX.add(projectionX);
      }
    });
  }, [data, chartRef]);

  return <div id={id} ref={chartRef} style={{ height: "100%" }}></div>;
};

export default Spectrogram;
