package com.smarttradetracker.app.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.smarttradetracker.app.MainActivity
import com.smarttradetracker.app.R

class FCMService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        private const val CHANNEL_ID = "smart_trade_tracker_notifications"
        private const val CHANNEL_NAME = "Smart Trade Tracker"
        private const val CHANNEL_DESCRIPTION = "Notifications de trading et alertes"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "Message reçu de: ${remoteMessage.from}")

        // Vérifier si le message contient des données
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Données du message: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // Vérifier si le message contient une notification
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Notification: ${notification.body}")
            sendNotification(
                title = notification.title ?: getString(R.string.app_name),
                body = notification.body ?: "",
                data = remoteMessage.data
            )
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Nouveau token FCM: $token")
        
        // Envoyer le token au serveur
        sendTokenToServer(token)
    }

    private fun handleDataMessage(data: Map<String, String>) {
        val title = data["title"] ?: getString(R.string.app_name)
        val body = data["body"] ?: data["message"] ?: ""
        val type = data["type"] ?: "general"
        
        when (type) {
            "trade_alert" -> handleTradeAlert(data)
            "price_alert" -> handlePriceAlert(data)
            "news" -> handleNewsAlert(data)
            else -> sendNotification(title, body, data)
        }
    }

    private fun handleTradeAlert(data: Map<String, String>) {
        val asset = data["asset"] ?: "N/A"
        val action = data["action"] ?: "N/A"
        val price = data["price"] ?: "N/A"
        
        sendNotification(
            title = "🚨 Alerte Trade: $asset",
            body = "$action à $price",
            data = data
        )
    }

    private fun handlePriceAlert(data: Map<String, String>) {
        val asset = data["asset"] ?: "N/A"
        val price = data["price"] ?: "N/A"
        val direction = data["direction"] ?: ""
        
        val emoji = if (direction == "up") "📈" else "📉"
        
        sendNotification(
            title = "$emoji Alerte Prix: $asset",
            body = "Prix actuel: $price",
            data = data
        )
    }

    private fun handleNewsAlert(data: Map<String, String>) {
        val headline = data["headline"] ?: "Nouvelle actualité"
        val source = data["source"] ?: ""
        
        sendNotification(
            title = "📰 News Trading",
            body = "$headline ${if (source.isNotEmpty()) "- $source" else ""}",
            data = data
        )
    }

    private fun sendNotification(title: String, body: String, data: Map<String, String> = emptyMap()) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Ajouter les données pour navigation
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 250, 250, 250))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Créer le canal de notification pour Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESCRIPTION
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)
            }
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }

    private fun sendTokenToServer(token: String) {
        // TODO: Implémenter l'envoi du token au backend
        // Ceci sera fait via une requête HTTP à votre API
        Log.d(TAG, "Token à envoyer au serveur: $token")
        
        // Sauvegarder le token localement
        getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply()
    }
}
