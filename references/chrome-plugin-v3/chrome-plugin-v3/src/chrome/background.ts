/* istanbul ignore file */

/* eslint-disable no-restricted-globals */
import * as BackgroundService from "../services/backgroundService";
import { enableBackgroundMessageListener } from "./messaging";
import SetupDevUtils from "../utils/development";
import { log } from "../services/logService";

/**
 * Attach all listeners needed to listen to tab changes.
 */
const enablePageEventsListener = () => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      BackgroundService.onPageCompletedEvent(tab);
    } else {
      BackgroundService.onPageLoadingEvent(tab);
    }
  });
};

const enableTimers = () => {
  chrome.alarms.create("every15min", { periodInMinutes: 15 });
  chrome.alarms.create("every60min", { periodInMinutes: 60 });
  log("[Alarm] Alarms set: 15 and 60 minutes.");

  chrome.alarms.onAlarm.addListener((alarm) => {
    BackgroundService.onTimerFired(alarm.name);
  });
};

/**
 * Subscribe to all Chrome functions needed.
 *
 * All Chrome listener functions goes here.
 */
const subscribeToChromeFunctions = () => {
  chrome.runtime.onInstalled.addListener(BackgroundService.onInstalledEvent);
  chrome.action.onClicked.addListener(BackgroundService.onIconClickListener);
  enableBackgroundMessageListener(BackgroundService.getMessagesTypes);
  enablePageEventsListener();
  enableTimers();
};

/**
 * Run all scripts needed on startup.
 */
const onApplicationStart = () => {
  SetupDevUtils();
  subscribeToChromeFunctions();
  BackgroundService.onApplicationStart();
};

onApplicationStart();

export {};
