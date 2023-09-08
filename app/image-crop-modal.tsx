import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import { router } from 'expo-router';
import { captureRef } from "react-native-view-shot";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  LayoutRectangle,
  LayoutChangeEvent,
  ImageLoadEventData,
  Platform,
  Pressable,
} from "react-native";
import { colors } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Svg, Defs, Rect, Mask, Circle } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect, useRef, useState } from "react";

const MAX_SCALE = 3;

type WrappedSvgProps = { radius: number; cx: number; cy: number };

const CircleOverlay: React.FC<WrappedSvgProps> = ({ radius, cx, cy }) => (
  <Svg height="100%" width="100%">
    <Defs>
      <Mask id="mask" x="0" y="0" height="100%" width="100%">
        <Rect height="100%" width="100%" fill="#fff" />
        <Circle r={radius} cx={cx} cy={cy} />
      </Mask>
    </Defs>
    <Rect
      height="100%"
      width="100%"
      fill="rgba(0, 0, 0, 0.5)"
      mask="url(#mask)"
      fill-opacity="0"
    />
  </Svg>
);

export default function ImageCropModal() {
  const [isError, setIsError] = useState(false)
  const { url } = useLocalSearchParams<{ url?: string}>()
  const [status, requestPermission] = MediaLibrary.usePermissions();
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const [initialImageSize, setInitialImageSize] = useState<{
    width: number;
    height: number;
    scale: number
  }>({ width: 0, height: 0, scale: 1 });

  const imageRef = useRef(null);

  const handleOnLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    // Сохраняем размеры контейнера, чтобы корректно отрендерить оверлей с рамкой
    setLayout(nativeEvent.layout);
  };

  const handleImageLoaded = ({
    nativeEvent,
  }: {
    nativeEvent: ImageLoadEventData;
  }) => {
    const { width, height } = nativeEvent.source;

    // #region Вычисление масштаба, чтобы картинка заполнила рамку
    let scale = 1;
    if (width < circleOverlayDiameter) {
      scale = circleOverlayDiameter / width
    }
    if (height < circleOverlayDiameter) {
      scale = circleOverlayDiameter / height
    }
    // #endregion

    setInitialImageSize({
      width: Math.floor(width),
      height: Math.floor(height),
      scale,
    });
  };

  useEffect(() => {
    scale.value = initialImageSize.scale;
  }, [initialImageSize])

  const circleOverlayDiameter = dimensions.width - 16;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  const imageContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd((event) => {
      const possibleScale = savedScale.value * event.scale;

      // #region Проверяем, что картинка с новым масштабом не меньше рамки и не превышает макс. значение масштаба 
      if (initialImageSize.width * possibleScale < circleOverlayDiameter) {
        scale.value = withSpring(initialImageSize.scale);
      }
      if (initialImageSize.height * possibleScale < circleOverlayDiameter) {
        scale.value = withSpring(initialImageSize.scale);
      }
      if (possibleScale > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
      }
      // #endregion
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const possibleNewTranslateX = savedTranslateX.value + event.translationX;
      const possibleNewTranslateY = savedTranslateY.value + event.translationY;

      translateX.value = withSpring(possibleNewTranslateX);
      translateY.value = withSpring(possibleNewTranslateY);
    })
    .onEnd((event) => {
      const possibleNewTranslateX = savedTranslateX.value + event.translationX;
      const possibleNewTranslateY = savedTranslateY.value + event.translationY;

      let currentScale = scale.value;

      // #region Проверяем, что картинка с новым масштабом не меньше рамки и не превышает макс. значение масштаба
      if (initialImageSize.width * currentScale < circleOverlayDiameter) {
        currentScale = initialImageSize.scale;
      }
      if (initialImageSize.height * currentScale < circleOverlayDiameter) {
        currentScale = initialImageSize.scale;
      }
      if (currentScale > MAX_SCALE) {
        currentScale = MAX_SCALE;
      }
      // #endregion

      const realImageWidth = initialImageSize.width * currentScale;
      const realImageHeight = initialImageSize.height * currentScale;

      // #region Вычисляем максимальный сдвиг по x, y
      const maxTranslateX =
        Math.abs(realImageWidth - circleOverlayDiameter) / 2;
      const maxTranslateY =
        Math.abs(realImageHeight - circleOverlayDiameter) / 2;
        // #endregion

        // #region Проверяем, что картинка не выходит за пределы рамки, иначе ограничиваем сдвиг
      if (possibleNewTranslateX > maxTranslateX) {
        translateX.value = withSpring(maxTranslateX);
      }
      if (possibleNewTranslateX < -maxTranslateX) {
        translateX.value = withSpring(-maxTranslateX);
      }

      if (possibleNewTranslateY > maxTranslateY) {
        translateY.value = withSpring(maxTranslateY);
      }
      if (possibleNewTranslateY < -maxTranslateY) {
        translateY.value = withSpring(-maxTranslateY);
      }
      // #endregion
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  const onSaveImageAsync = async () => {
    try {
      const localUri = await captureRef(imageRef, {
        height: 440,
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(localUri);
      if (localUri) {
        alert("Сохранено!");
        router.back()
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleSubmit = async () => {
    if (status === null || !status.granted) {
      // Запрашиваем пермишены, если они не предоставлены
      const { granted } = await requestPermission();
      if (!granted) {
        return;
      }
    }
    onSaveImageAsync();
  };

  if (!url || isError) {
    return (
      <View style={styles.wrapper}>
        <Text style={{color: colors.white, textAlign: 'center'}}>Изображение не выбрано</Text>
      </View>
    )
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.container} onLayout={handleOnLayout}>
        <View style={{flex: 1, width: circleOverlayDiameter, maxHeight: circleOverlayDiameter}} ref={imageRef}>
          <GestureDetector gesture={composedGestures}>
            <Animated.View style={imageContainerAnimatedStyle}>
              <Animated.Image
                source={{ uri: url }}
                onError={() => setIsError(true)}
                onLoad={handleImageLoaded}
                style={[
                  imageAnimatedStyle,
                  {
                    width: '100%',
                    height: '100%',
                  },
                ]}
                resizeMethod="scale"
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
      <Pressable style={{ width: "100%" }} onPress={handleSubmit}>
        {({ pressed }) => (
          <View
            style={[styles.buttonContainer, { opacity: pressed ? 0.5 : 1 }]}
          >
            <View style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Сохранить</Text>
            </View>
          </View>
        )}
      </Pressable>

      {!!layout && (
        <View
          style={{
            width: layout.width,
            height: layout.height,
            top: layout.y,
            right: layout.x,
            position: "absolute",
          }}
          pointerEvents="none"
        >
          <CircleOverlay
            radius={circleOverlayDiameter / 2}
            cx={layout.width / 2}
            cy={layout.height / 2}
          />
        </View>
      )}

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  continueButton: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  continueButtonText: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
  },
});
