import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import bcrypt from "bcryptjs";

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requirePermission("MANAGE_USERS");

    const { id } = await params;
    const body = await request.json();
    const { name, password, role, isActive, regionAccess } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: name || null,
      role: role || existingUser.role,
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
    };

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update region access (for non-admin users)
    if (role !== "ADMIN") {
      // Delete existing access
      await prisma.userRegionAccess.deleteMany({
        where: { userId: id },
      });

      // Create new access records
      if (regionAccess && regionAccess.length > 0) {
        const regions = await prisma.region.findMany({
          where: { code: { in: regionAccess } },
        });

        await prisma.userRegionAccess.createMany({
          data: regions.map((region) => ({
            userId: user.id,
            regionId: region.id,
          })),
        });
      }
    } else {
      // Admin users don't need region access records
      await prisma.userRegionAccess.deleteMany({
        where: { userId: id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requirePermission("MANAGE_USERS");

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Delete user (cascades to regionAccess, sessions, accounts)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
