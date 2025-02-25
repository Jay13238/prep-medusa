import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function AdminOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("orderPlacedHandler triggered. Order ID:", data.id);

  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  console.log("Notification module service resolved");

  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );
  console.log("Order module service resolved");

  try {
    console.log("Attempting to retrieve order details");
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    });
    console.log("Order details retrieved successfully");
    console.log("Preparing to send email notification");

     const adminEmail = "thepreparation@gmail.com";

    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: "email",
      template: "d-6662b16a12fc47f58ec5625a4490b123", // Replace with your actual template ID
      data: {
        shipping_address: order.shipping_address,
        customer_email: order.email,
        customer_phone: order.shipping_address.phone,
        items: order.items.map((item) => ({
          title: item.product_title,
          variant_name: item.title ?? "N/A",
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    });
    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error in orderPlacedHandler:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
