// @ts-nocheck
import { subscription } from "./manager-runtime.ts";
export async function openOAuth2Subscription(interaction: any) { return subscription.gerenciarassinatura(interaction.client, interaction); }
export async function openOAuth2SubscriptionManager(interaction: any) { return subscription.renovarassinatura(interaction.client, interaction); }
