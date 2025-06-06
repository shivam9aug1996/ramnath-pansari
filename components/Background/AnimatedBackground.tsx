import React from 'react';
import { StyleSheet, View, Dimensions, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  htmlContent?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  style,
  htmlContent = defaultAnimation // We'll define this below
}) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: transparent;
          }
          .animation-wrapper {
            width: 100vw;
            height: 100vh;
            position: fixed;
          }
        </style>
      </head>
      <body>
        <div class="animation-wrapper">
          ${htmlContent}
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        bounces={false}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

// Example of a default animation using Aceternity-style gradient
const defaultAnimation = `
  <div class="relative w-full h-full bg-slate-950">
    <!-- Gradient Background -->
    <div class="absolute inset-0 w-full h-full bg-gradient-to-br from-violet-500/30 via-transparent to-emerald-500/30 opacity-50"></div>
    
    <!-- Shooting Stars Container -->
    <div class="stars-container">
      ${Array.from({ length: 20 }, (_, i) => `
        <div class="shooting-star" style="--delay: ${i * 0.3}s"></div>
      `).join('')}
    </div>

    <!-- Animated Blobs -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    
    <style>
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      .animate-blob {
        animation: blob 7s infinite;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-4000 {
        animation-delay: 4s;
      }

      /* Shooting Stars Styles */
      .stars-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        transform: rotate(-35deg);
      }
      
      .shooting-star {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 2px;
        background: linear-gradient(90deg, white, transparent);
        animation: shooting 3s linear infinite;
        animation-delay: var(--delay);
        opacity: 0;
      }

      @keyframes shooting {
        0% {
          transform: translate(-70vw, -70vh);
          opacity: 1;
        }
        20% {
          opacity: 1;
        }
        30% {
          opacity: 0;
        }
        100% {
          transform: translate(70vw, 70vh);
          opacity: 0;
        }
      }
    </style>
  </div>
`;

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    position: 'relative',
  },
  webview: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
});

export default AnimatedBackground;