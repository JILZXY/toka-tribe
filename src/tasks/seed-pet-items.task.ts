import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PetItemDocument } from '../modules/pets/infrastructure/persistence/schemas/pet-item.schema.js';
import { PetSlot } from '../shared/domain/enums/pet-slot.enum.js';

@Injectable()
export class SeedPetItemsTask implements OnModuleInit {
  private readonly logger = new Logger(SeedPetItemsTask.name);

  constructor(
    @InjectModel(PetItemDocument.name)
    private readonly petItemModel: Model<PetItemDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Verificando y sembrando cosméticos de mascotas en la tienda...');

    const initialItems = [
      {
        itemId: 'hat_sombrero',
        name: 'Sombrero Clásico',
        imageUrl: 'https://tokaloteimage.sfo3.cdn.digitaloceanspaces.com/mascota_sombrero.png',
        slot: PetSlot.HAT,
        pointCost: 200,
        isAvailable: true,
      },
      {
        itemId: 'shirt_chaqueta',
        name: 'Chaqueta Cool',
        imageUrl: 'https://tokaloteimage.sfo3.cdn.digitaloceanspaces.com/mascota_chaqueta.png',
        slot: PetSlot.SHIRT,
        pointCost: 750,
        isAvailable: true,
      },
      {
        itemId: 'acc_bufanda',
        name: 'Bufanda Roja',
        imageUrl: 'https://tokaloteimage.sfo3.cdn.digitaloceanspaces.com/mascota_bufanda.png',
        slot: PetSlot.ACCESSORY,
        pointCost: 400,
        isAvailable: true,
      },
      {
        itemId: 'acc_lentes',
        name: 'Lentes de Sol',
        imageUrl: 'https://tokaloteimage.sfo3.cdn.digitaloceanspaces.com/mascota_lentes.png',
        slot: PetSlot.ACCESSORY,
        pointCost: 600,
        isAvailable: true,
      },
    ];

    for (const item of initialItems) {
      const existing = await this.petItemModel.findOne({ itemId: item.itemId }).exec();
      if (!existing) {
        await this.petItemModel.create(item);
        this.logger.log(`Ítem creado: ${item.itemId}`);
      } else {
        // Actualizar URL por si cambiaron de hardcodeadas a finales
        if (existing.imageUrl !== item.imageUrl || existing.pointCost !== item.pointCost) {
            existing.imageUrl = item.imageUrl;
            existing.pointCost = item.pointCost;
            await existing.save();
            this.logger.log(`Ítem actualizado: ${item.itemId}`);
        }
      }
    }

    this.logger.log('Sembrado de cosméticos finalizado.');
  }
}
