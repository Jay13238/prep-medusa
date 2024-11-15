import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderService = container.resolve("orderService");

  try {
    //@ts-ignore
    const order = await orderService.retrieve(data.id, {
      relations: ["items", "shipping_address"],
    });

    await notificationModuleService.createNotifications({
      to: "joshuahoffmann60@gmail.com",
      channel: "email",
      template: "d-6662b16a12fc47f58ec5625a4490b123 ", // Replace with your actual template ID
      data: {
        shipping_address: order.shipping_address,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        total_amount: order.total,
      },
    });
  } catch (error) {
    console.error("Failed to send order notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
