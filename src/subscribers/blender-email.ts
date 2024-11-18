import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  INotificationModuleService,
  IOrderModuleService,
  IProductModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function BlenderCategoryOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("BlenderCategoryOrderHandler triggered. Order ID:", data.id);

  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  console.log("Notification module service resolved");

  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );
  console.log("Order module service resolved");

  const productModuleService: IProductModuleService = container.resolve(
    Modules.PRODUCT
  );
  console.log("Product module service resolved");

  try {
    console.log("Attempting to retrieve order details");
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    });
    console.log("Order details retrieved successfully");

    // Retrieve all product IDs from the order items
    const productIds = order.items.map((item) => item.product_id);

    // Fetch product details for each product ID
    const products = await productModuleService.listProducts({
      id: productIds,
    });

    // Check if any product belongs to the "blender" category
    const blenderItems = order.items.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return product?.categories?.some(
        (category) => category.handle === "blender"
      );
    });

    if (blenderItems.length === 0) {
      console.log(
        'No items from the "blender" category in this order. Exiting handler.'
      );
      return;
    }

    console.log("Preparing to send email notification");

    const adminEmail = "joshuahoffmann60@gmail.com";

    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: "email",
      template: "d-6662b16a12fc47f58ec5625a4490b123", // Replace with your actual template ID
      data: {
        shipping_address: order.shipping_address,
        items: blenderItems.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    });
    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error in BlenderCategoryOrderHandler:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
