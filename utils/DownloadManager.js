import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

class DownloadManager {
  constructor(callback) {
    this.callback = callback;
    this.downloadResumable = null;
  }

  /**
   * Starts a new download or resumes a paused one if available.
   * Checks if the file already exists.
   * @param {string} url - The URL of the file to download.
   * @param {string} fileName - The name to save the file as.
   */
  async startDownload(url, fileName) {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Check if the file already exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      //console.log(`File already exists at ${fileUri}`);
      return fileUri; // Return the URI of the existing file
    }

    // Check if there is a paused download
    const savedDownload = await AsyncStorage.getItem(
      `pausedDownload_${fileName}`
    );
    if (savedDownload) {
      const snapshot = JSON.parse(savedDownload);
      this.downloadResumable = new FileSystem.DownloadResumable(
        snapshot.url,
        snapshot.fileUri,
        snapshot.options,
        this.callback,
        snapshot.resumeData
      );
    } else {
      this.downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        this.callback
      );
    }

    try {
      const { uri } = await this.downloadResumable.downloadAsync();
      //console.log(`Finished downloading to ${uri}`);
      await AsyncStorage.removeItem(`pausedDownload_${fileName}`); // Clean up
      return uri;
    } catch (e) {
      console.error("Error during download:", e);
      return null;
    }
  }

  /**
   * Pauses the download and saves the state.
   * @param {string} fileName - The name of the file being downloaded.
   */
  async pauseDownload(fileName) {
    if (this.downloadResumable) {
      try {
        await this.downloadResumable.pauseAsync();
        const savableData = this.downloadResumable.savable();
        await AsyncStorage.setItem(
          `pausedDownload_${fileName}`,
          JSON.stringify(savableData)
        );
        //console.log(`Paused and saved download state for ${fileName}`);
      } catch (e) {
        console.error("Error pausing download:", e);
      }
    }
  }

  /**
   * Resumes a paused download.
   * @param {string} fileName - The name of the file being downloaded.
   */
  async resumeDownload(fileName) {
    const savedDownload = await AsyncStorage.getItem(
      `pausedDownload_${fileName}`
    );
    if (!savedDownload) {
      console.error("No paused download found for:", fileName);
      return null;
    }

    const snapshot = JSON.parse(savedDownload);
    this.downloadResumable = new FileSystem.DownloadResumable(
      snapshot.url,
      snapshot.fileUri,
      snapshot.options,
      this.callback,
      snapshot.resumeData
    );

    try {
      const { uri } = await this.downloadResumable.resumeAsync();
      //console.log(`Resumed and finished downloading to ${uri}`);
      await AsyncStorage.removeItem(`pausedDownload_${fileName}`); // Clean up
      return uri;
    } catch (e) {
      console.error("Error resuming download:", e);
      return null;
    }
  }
}

export default DownloadManager;
