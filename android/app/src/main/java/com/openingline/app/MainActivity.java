package com.openingline.app;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(ApkInstaller.class);
        registerPlugin(ApkDownloader.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * APK installer — takes a local file path, opens Android package installer
     */
    @CapacitorPlugin(name = "ApkInstaller")
    public static class ApkInstaller extends Plugin {

        @PluginMethod
        public void installApk(PluginCall call) {
            String path = call.getString("path");
            if (path == null || path.isEmpty()) {
                call.reject("No file path provided");
                return;
            }

            try {
                File apkFile = new File(path);
                if (!apkFile.exists()) {
                    call.reject("APK file not found: " + path);
                    return;
                }

                Uri contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );

                String mimeType = "application/vnd.android.package-archive";

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, mimeType);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                getActivity().startActivity(intent);

                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to open APK installer: " + e.getMessage(), e);
            }
        }
    }

    /**
     * Native APK downloader — downloads file on background thread, reports progress.
     * Completely bypasses WebView network restrictions.
     */
    @CapacitorPlugin(name = "ApkDownloader")
    public static class ApkDownloader extends Plugin {

        private volatile boolean isCancelled = false;

        @PluginMethod
        public void download(PluginCall call) {
            String urlStr = call.getString("url");
            String filename = call.getString("filename", "download.apk");

            if (urlStr == null || urlStr.isEmpty()) {
                call.reject("No URL provided");
                return;
            }

            isCancelled = false;

            // Run download on background thread
            new Thread(() -> {
                HttpURLConnection connection = null;
                InputStream inputStream = null;
                FileOutputStream outputStream = null;

                try {
                    File outputFile = new File(getContext().getCacheDir(), filename);

                    URL url = new URL(urlStr);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(30000);
                    connection.setReadTimeout(60000);
                    connection.setRequestProperty("User-Agent", "OpeningLine-Android/1.0");
                    connection.setInstanceFollowRedirects(true);

                    // Handle redirects manually (some servers need this)
                    int status = connection.getResponseCode();
                    int redirectCount = 0;
                    while ((status == 301 || status == 302 || status == 303 || status == 307 || status == 308)
                            && redirectCount < 10) {
                        String newUrl = connection.getHeaderField("Location");
                        if (newUrl == null) break;
                        connection.disconnect();

                        url = new URL(newUrl);
                        connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(30000);
                        connection.setReadTimeout(60000);
                        connection.setRequestProperty("User-Agent", "OpeningLine-Android/1.0");
                        connection.setInstanceFollowRedirects(true);
                        status = connection.getResponseCode();
                        redirectCount++;
                    }

                    if (status != 200) {
                        call.reject("HTTP error: " + status);
                        return;
                    }

                    int totalSize = connection.getContentLength();
                    inputStream = connection.getInputStream();
                    outputStream = new FileOutputStream(outputFile);

                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    long totalRead = 0;
                    int lastProgress = 0;

                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        if (isCancelled) {
                            call.reject("Download cancelled");
                            return;
                        }
                        outputStream.write(buffer, 0, bytesRead);
                        totalRead += bytesRead;

                        // Report progress (every 2% to avoid flooding)
                        if (totalSize > 0) {
                            int progress = (int) (totalRead * 100 / totalSize);
                            if (progress >= lastProgress + 2) {
                                lastProgress = progress;
                                JSObject progressData = new JSObject();
                                progressData.put("type", "progress");
                                progressData.put("progress", progress);
                                progressData.put("loaded", totalRead);
                                progressData.put("total", totalSize);
                                notifyListeners("downloadProgress", progressData);
                            }
                        }
                    }

                    outputStream.flush();

                    // Send completion event
                    JSObject completeData = new JSObject();
                    completeData.put("type", "complete");
                    completeData.put("path", outputFile.getAbsolutePath());
                    completeData.put("size", totalRead);
                    notifyListeners("downloadProgress", completeData);

                    // Resolve the plugin call with the file path
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("path", outputFile.getAbsolutePath());
                    result.put("size", totalRead);
                    call.resolve(result);

                } catch (Exception e) {
                    if (!isCancelled) {
                        call.reject("Download failed: " + e.getMessage(), e);
                    }
                } finally {
                    try { if (inputStream != null) inputStream.close(); } catch (Exception ignored) {}
                    try { if (outputStream != null) outputStream.close(); } catch (Exception ignored) {}
                    if (connection != null) connection.disconnect();
                }
            }).start();
        }

        @PluginMethod
        public void cancel(PluginCall call) {
            isCancelled = true;
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        }
    }
}
