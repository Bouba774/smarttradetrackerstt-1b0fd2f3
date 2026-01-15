package com.smarttradetracker.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

class SmartTradeTrackerApp : Application() {

    companion object {
        private const val TAG = "SmartTradeTrackerApp"
        const val NOTIFICATION_CHANNEL_ID = "smart_trade_tracker_notifications"
    }

    override fun onCreate() {
        super.onCreate()
        
        // Initialiser Firebase
        FirebaseApp.initializeApp(this)
        
        // Créer les canaux de notification
        createNotificationChannels()
        
        // Récupérer le token FCM
        retrieveFCMToken()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Canal principal
            val mainChannel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Notifications Trading",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertes et notifications de trading"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)
            }

            // Canal pour les alertes de prix
            val priceChannel = NotificationChannel(
                "price_alerts",
                "Alertes de Prix",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertes lorsque les prix atteignent vos seuils"
                enableVibration(true)
            }

            // Canal pour les news
            val newsChannel = NotificationChannel(
                "news_alerts",
                "Actualités",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Actualités et analyses de marché"
            }

            notificationManager.createNotificationChannels(
                listOf(mainChannel, priceChannel, newsChannel)
            )
        }
    }

    private fun retrieveFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Échec de récupération du token FCM", task.exception)
                return@addOnCompleteListener
            }

            val token = task.result
            Log.d(TAG, "Token FCM: $token")
            
            // Sauvegarder le token
            getSharedPreferences("fcm_prefs", MODE_PRIVATE)
                .edit()
                .putString("fcm_token", token)
                .apply()
        }
    }
}
